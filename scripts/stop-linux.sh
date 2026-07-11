#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="prelegal"

docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 && echo "Prelegal stopped." || echo "Prelegal container is not running."
