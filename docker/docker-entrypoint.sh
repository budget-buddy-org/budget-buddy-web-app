#!/bin/sh
set -e

# Replace environment variables in config.json.template and save to config.json.
# Explicit variable list prevents accidental substitution of other $ tokens in the JSON.
envsubst '$VITE_API_URL $VITE_OIDC_ISSUER $VITE_OIDC_CLIENT_ID' \
  < /usr/share/nginx/html/config.json.template \
  > /usr/share/nginx/html/config.json

# Build the Content-Security-Policy header with runtime-resolved OIDC issuer.
envsubst '$VITE_API_URL $VITE_OIDC_ISSUER' \
  < /etc/nginx/snippets/security-headers.conf.template \
  > /etc/nginx/snippets/security-headers.conf

# Execute the original command
exec "$@"
