package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

func origin(value string) (string, error) {
	if value == "" {
		return "'self'", nil
	}
	u, err := url.Parse(value)
	if err != nil || (u.Scheme != "https" && u.Scheme != "http") || u.Host == "" || u.User != nil || strings.ContainsAny(u.Host, "$`{}") || strings.ContainsAny(value, "\"'\\;\r\n\t ") {
		return "", fmt.Errorf("invalid API or OIDC URL")
	}
	return u.Scheme + "://" + u.Host, nil
}

func configure(directory string) error {
	config := map[string]string{}
	for _, key := range []string{"VITE_API_URL", "VITE_OIDC_ISSUER", "VITE_OIDC_CLIENT_ID", "VITE_OIDC_SCOPES", "VITE_OIDC_USER_MANAGEMENT_URL"} {
		config[key] = os.Getenv(key)
	}
	api, err := origin(config["VITE_API_URL"])
	if err != nil {
		return err
	}
	issuer, err := origin(config["VITE_OIDC_ISSUER"])
	if err != nil {
		return err
	}
	data, err := json.Marshal(config)
	if err != nil {
		return err
	}
	if err = os.WriteFile(filepath.Join(directory, "config.json"), data, 0600); err != nil {
		return err
	}
	template, err := os.ReadFile("/etc/nginx/security-headers.conf.template")
	if err != nil {
		return err
	}
	headers := strings.NewReplacer("$VITE_API_URL", api, "$VITE_OIDC_ISSUER", issuer).Replace(string(template))
	if err = os.WriteFile(filepath.Join(directory, "security-headers.conf"), []byte(headers), 0600); err != nil {
		return err
	}
	server, err := os.ReadFile("/etc/nginx/conf.d/default.conf")
	if err != nil {
		return err
	}
	serverConfig := strings.ReplaceAll(string(server), "/tmp/web/", directory+"/")
	if err = os.WriteFile(filepath.Join(directory, "server.conf"), []byte(serverConfig), 0600); err != nil {
		return err
	}
	mainConfig, err := os.ReadFile("/etc/nginx/nginx.conf")
	if err != nil {
		return err
	}
	generated := strings.ReplaceAll(string(mainConfig), "/etc/nginx/conf.d/*.conf", filepath.Join(directory, "server.conf"))
	return os.WriteFile(filepath.Join(directory, "nginx.conf"), []byte(generated), 0600)
}

func run() error {
	if len(os.Args) == 2 && os.Args[1] == "healthcheck" {
		client := http.Client{Timeout: 3 * time.Second}
		response, err := client.Get("http://127.0.0.1:8080/healthz")
		if err != nil {
			return err
		}
		defer response.Body.Close()
		if response.StatusCode != http.StatusOK {
			return fmt.Errorf("unhealthy HTTP status: %d", response.StatusCode)
		}
		return nil
	}
	// MkdirTemp atomically creates a private 0700 directory, avoiding predictable
	// paths and pre-existing symlinks in the shared temporary directory.
	directory, err := os.MkdirTemp("", "budget-buddy-web-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(directory)
	if err := configure(directory); err != nil {
		return err
	}
	return syscall.Exec("/usr/sbin/nginx", []string{"nginx", "-c", filepath.Join(directory, "nginx.conf"), "-e", "/dev/stderr", "-g", "daemon off;"}, os.Environ())
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
