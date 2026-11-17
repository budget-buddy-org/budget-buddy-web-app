#!/bin/sh
set -eu

docker run --detach --name web-smoke --platform "$PLATFORM" \
  --publish 127.0.0.1::8080 \
  --env VITE_API_URL=https://api.example.test \
  --env VITE_OIDC_ISSUER=https://identity.example.test \
  "$IMAGE_REF"
trap 'docker logs web-smoke; docker rm --force web-smoke' EXIT
port=$(docker port web-smoke 8080/tcp | awk -F: '{print $NF}')
url="http://127.0.0.1:$port"
curl --fail --retry 10 --retry-connrefused --retry-delay 1 "$url/" > /dev/null
curl --fail --silent "$url/config.json" | jq -e '.VITE_API_URL == "https://api.example.test"'
curl --fail --silent "$url/transactions" > /dev/null
[ "$(docker exec web-smoke id -u)" != '0' ]
