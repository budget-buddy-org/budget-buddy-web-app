#!/bin/sh
set -eu

docker run --detach --name web-smoke --platform "$PLATFORM" \
  --read-only --tmpfs /tmp:rw,noexec,nosuid,size=32m --cap-drop ALL --security-opt no-new-privileges \
  --publish 127.0.0.1::8080 \
  --env 'VITE_OIDC_CLIENT_ID=client"with\escaping' \
  --env VITE_API_URL=https://api.example.test \
  --env VITE_OIDC_ISSUER=https://identity.example.test \
  "$IMAGE_REF"
trap 'docker logs web-smoke; docker rm --force web-smoke' EXIT
port=$(docker port web-smoke 8080/tcp | awk -F: '{print $NF}')
url="http://127.0.0.1:$port"
curl --fail --retry 10 --retry-all-errors --retry-delay 1 "$url/" > /dev/null
curl --fail --silent "$url/config.json" | jq -e '.VITE_API_URL == "https://api.example.test"'
curl --fail --silent "$url/config.json" | jq -e '.VITE_OIDC_CLIENT_ID == "client\"with\\escaping"'
curl --fail --silent "$url/transactions" > /dev/null
[ "$(docker inspect --format '{{.Config.User}}' web-smoke)" = '65532:65532' ]
docker exec web-smoke /usr/local/bin/runtime healthcheck
if docker exec web-smoke /bin/sh -c true >/dev/null 2>&1; then
  echo 'Runtime must not contain a shell' >&2
  exit 1
fi
curl --fail --silent --head "$url/" | grep -i 'content-security-policy:.*https://identity.example.test'
docker stop --time 5 web-smoke >/dev/null
[ "$(docker inspect --format '{{.State.ExitCode}}' web-smoke)" = '0' ]
