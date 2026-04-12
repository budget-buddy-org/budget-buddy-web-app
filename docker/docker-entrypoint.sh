#!/bin/sh
set -e

# Replace environment variables in config.json.template and save to config.json
# We specify the variables to replace to avoid accidentally replacing other $ signs in the JSON
envsubst '$VITE_API_URL' < /usr/share/nginx/html/config.json.template > /usr/share/nginx/html/config.json

# Execute the original command
exec "$@"
