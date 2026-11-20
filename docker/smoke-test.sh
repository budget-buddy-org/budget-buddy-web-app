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
curl --fail --silent --head "$url/" | grep -Fi 'frame-src https://identity.example.test'
curl --fail --silent "$url/transactions" > /dev/null
[ "$(docker exec web-smoke awk '/^Uid:/ {print $2}' /proc/1/status)" = '65532' ]
docker exec --user 65532 web-smoke sh -c '
  set -e
  for file in \
    /etc/nginx/snippets/security-headers.conf.template \
    /etc/nginx/conf.d/default.conf \
    /usr/share/nginx/html/index.html \
    /usr/local/bin/docker-entrypoint.sh; do
    [ "$(stat -c %u "$file")" = "0" ]
    [ ! -w "$file" ]
  done
  [ "$(stat -c %u /usr/share/nginx/html)" = "0" ]
  [ ! -w /usr/share/nginx/html ]
  [ "$(stat -c %u /usr/share/nginx/html/config.json)" = "65532" ]
  [ -w /usr/share/nginx/html/config.json ]
'
