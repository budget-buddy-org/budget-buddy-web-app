#!/bin/sh
set -eu
umask 077

# Atomically create a private directory; never follow predictable /tmp paths.
runtime_dir=$(mktemp -d)
trap 'rm -rf "$runtime_dir"' EXIT

# jq encodes arbitrary configuration values safely as JSON.
jq -n '{
  VITE_API_URL: (env.VITE_API_URL // ""),
  VITE_OIDC_ISSUER: (env.VITE_OIDC_ISSUER // ""),
  VITE_OIDC_CLIENT_ID: (env.VITE_OIDC_CLIENT_ID // ""),
  VITE_OIDC_SCOPES: (env.VITE_OIDC_SCOPES // ""),
  VITE_OIDC_USER_MANAGEMENT_URL: (env.VITE_OIDC_USER_MANAGEMENT_URL // "")
}' > "$runtime_dir/config.json"

# Allow HTTP(S) origins only, so runtime values cannot inject nginx directives
# or CSP sources. Keep full URLs in config.json but use origins in the CSP.
origin() {
  local origin_url="$1"
  jq -ner --arg value "$origin_url" '
    if $value == "" then "\u0027self\u0027"
    elif $value | test("^https?://[A-Za-z0-9.\\[\\]:-]+(?:/[^\\s\\\"\u0027;\\\\]*)?$")
    then $value | capture("^(?<origin>https?://[^/]+)").origin
    else error("Invalid API or OIDC URL") end'
}
VITE_API_URL=$(origin "${VITE_API_URL:-}")
VITE_OIDC_ISSUER=$(origin "${VITE_OIDC_ISSUER:-}")
export VITE_API_URL VITE_OIDC_ISSUER
envsubst '$VITE_API_URL $VITE_OIDC_ISSUER' \
  < /etc/nginx/security-headers.conf.template \
  > "$runtime_dir/security-headers.conf"

sed "s|/tmp/web/|$runtime_dir/|g" /etc/nginx/conf.d/default.conf > "$runtime_dir/server.conf"
sed "s|/etc/nginx/conf.d/\\*.conf|$runtime_dir/server.conf|g" /etc/nginx/nginx.conf > "$runtime_dir/nginx.conf"

# Replace the shell so nginx receives container shutdown signals directly.
exec nginx -c "$runtime_dir/nginx.conf" -e /dev/stderr -g 'daemon off;'
