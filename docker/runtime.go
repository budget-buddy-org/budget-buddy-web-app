package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
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

func configure() error {
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
	if err = os.MkdirAll("/tmp/web", 0700); err != nil {
		return err
	}
	if err = os.WriteFile("/tmp/web/config.json", data, 0600); err != nil {
		return err
	}
	template, err := os.ReadFile("/etc/nginx/security-headers.conf.template")
	if err != nil {
		return err
	}
	headers := strings.NewReplacer("$VITE_API_URL", api, "$VITE_OIDC_ISSUER", issuer).Replace(string(template))
	return os.WriteFile("/tmp/web/security-headers.conf", []byte(headers), 0600)
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
	if err := configure(); err != nil {
		return err
	}
	return syscall.Exec("/usr/sbin/nginx", []string{"nginx", "-e", "/dev/stderr", "-g", "daemon off;"}, os.Environ())
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
