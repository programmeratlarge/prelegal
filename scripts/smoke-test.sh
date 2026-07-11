#!/usr/bin/env bash
# Builds the Docker image, runs it, and verifies the container serves
# traffic on port 8000 before tearing it down. Usable on mac/linux.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

IMAGE_NAME="prelegal-smoke"
CONTAINER_NAME="prelegal-smoke"

cleanup() {
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker build -t "$IMAGE_NAME" .
docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER_NAME" -p 8000:8000 --env-file .env "$IMAGE_NAME"

echo "Waiting for http://localhost:8000 to respond..."
for _ in $(seq 1 20); do
  if curl -sf http://localhost:8000/ >/dev/null; then
    echo "Home page: OK"
    break
  fi
  sleep 1
done

if ! curl -sf http://localhost:8000/ >/dev/null; then
  echo "FAILED: home page never became available"
  docker logs "$CONTAINER_NAME"
  exit 1
fi

status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/me)
if [ "$status" != "401" ]; then
  echo "FAILED: expected 401 from /api/me, got $status"
  docker logs "$CONTAINER_NAME"
  exit 1
fi
echo "/api/me: OK (401 as expected when signed out)"

echo "Smoke test passed."
