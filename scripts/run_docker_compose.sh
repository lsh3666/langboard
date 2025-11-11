#!/bin/bash -l

case "$(uname -s)" in
    Linux*)   CURRENT_OS="linux" ;;
    Darwin*)  CURRENT_OS="mac" ;;
    CYGWIN*|MINGW*|MSYS*|Windows*) CURRENT_OS="windows" ;;
    *)        CURRENT_OS="linux" ;;
esac

if ! command -v docker >/dev/null 2>&1 || ! command -v docker-compose >/dev/null 2>&1; then
    echo Docker is not installed or not found in PATH. Please install Docker to proceed.
    if [ "$CURRENT_OS" = "linux" ]; then
        DOCKER_URL="https://docs.docker.com/desktop/setup/install/linux/"
    else
        DOCKER_URL="https://docs.docker.com/desktop/setup/install/$CURRENT_OS-install/"
    fi
    echo You can download it from $DOCKER_URL
    exit 1
fi

COMPOSE_PREFIX="./docker/docker-compose"
COMPOSE_ARGS="-f $COMPOSE_PREFIX.kafka.yaml -f $COMPOSE_PREFIX.pg.yaml -f $COMPOSE_PREFIX.redis.yaml -f $COMPOSE_PREFIX.server.yaml --env-file ./.env"
DOCS_COMPOSE_ARGS="-f $COMPOSE_PREFIX.docs.yaml"
UI_WATCHER_COMPOSE_ARGS="-f $COMPOSE_PREFIX.ui-watcher.yaml"
OLLAMA_SHARED_COMPOSE_ARGS="-f $COMPOSE_PREFIX.ollama.shared.yaml"
OLLAMA_CPU_COMPOSE_ARGS="-f $COMPOSE_PREFIX.ollama.cpu.yaml $OLLAMA_SHARED_COMPOSE_ARGS"
OLLAMA_GPU_COMPOSE_ARGS="-f $COMPOSE_PREFIX.ollama.gpu.yaml $OLLAMA_SHARED_COMPOSE_ARGS"


for arg in "$@"; do
    if [[ "$arg" == "docs" ]]; then
        COMPOSE_ARGS="$COMPOSE_ARGS $DOCS_COMPOSE_ARGS"
    elif [[ "$arg" == "ui-watcher" ]]; then
        COMPOSE_ARGS="$COMPOSE_ARGS $UI_WATCHER_COMPOSE_ARGS"
    elif [[ "$arg" == "ollama-cpu" ]]; then
        COMPOSE_ARGS="$COMPOSE_ARGS $OLLAMA_CPU_COMPOSE_ARGS"
    elif [[ "$arg" == "ollama-gpu" ]]; then
        COMPOSE_ARGS="$COMPOSE_ARGS $OLLAMA_GPU_COMPOSE_ARGS"
    fi
done

cd ../

if [ ! -f .env ]; then
    cp .env.example .env
fi

docker compose -f $COMPOSE_PREFIX.yaml $COMPOSE_ARGS up -d --build
