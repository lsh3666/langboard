#!/bin/bash

CURRENT_DIR=$(basename "$PWD")

if [[ "$CURRENT_DIR" == "langboard" && -d "./docker" ]]; then
    cd docker
elif [[ "$CURRENT_DIR" == "docker" ]]; then
    :
else
    echo "You must run this script from the langboard root directory or the docker directory."
    exit 1
fi

cd ../

TEMPLATE_FILE_PATH="docker/docker-compose.server.yaml.template"
API_TEMPLATE_FILE_PATH="docker/docker-compose.server.api.yaml.template"
NGINX_TEMPLATE_FILE_PATH="docker/server/conf-scale.template"
OUTPUT_FILE_PATH="docker/docker-compose.server.yaml"
NGINX_OUTPUT_FILE_PATH="docker/server/conf.template"

source .env

API_WORKERS_COUNT=${API_WORKERS_COUNT:-1}
API_WORKERS_COUNT=$((API_WORKERS_COUNT - 1))

CONTAINERS=""
CONTAINER_NAMES=""
NGINX_UPSTREAMS=""

for index in $(seq 0 $API_WORKERS_COUNT); do
    container_name="api_${index}"
    converted_template=$(sed \
        -e "s%{{index}}%${index}%g" \
        "$API_TEMPLATE_FILE_PATH"
    )

    CONTAINERS+="${converted_template}\n"
    if [[ $index -ne 0 ]]; then
        CONTAINER_NAMES+="\n"
    fi
    CONTAINER_NAMES+="      - ${container_name}"

    if [[ $index -ne 0 ]]; then
        NGINX_UPSTREAMS+="\n"
    fi
    NGINX_UPSTREAMS+="    server \${API_HOST}_${index}:\${API_PORT};"
done


if [[ -n "$CONTAINER_NAMES" ]]; then
    CONTAINERS=$(echo -e "$CONTAINERS" | awk '{printf "%s\\n", $0}')
    CONTAINER_NAMES=$(echo -e "$CONTAINER_NAMES" | awk '{printf "%s\\n", $0}')
    NGINX_UPSTREAMS=$(echo -e "$NGINX_UPSTREAMS" | awk '{printf "%s\\n", $0}')
    if [[ "${CONTAINER_NAMES: -2}" == "\\n" ]]; then
        CONTAINER_NAMES="${CONTAINER_NAMES::-2}"
    fi
    if [[ "${NGINX_UPSTREAMS: -2}" == "\\n" ]]; then
        NGINX_UPSTREAMS="${NGINX_UPSTREAMS::-2}"
    fi

    sed -e "s%{{API_WORKER_CONTAINER_NAMES}}%${CONTAINER_NAMES}%g" \
        -e "s%{{API_WORKER_CONTAINERS}}%${CONTAINERS}%g" \
        "$TEMPLATE_FILE_PATH" > "$OUTPUT_FILE_PATH"

    sed -e "s%{{UPSTREAM_APIS}}%${NGINX_UPSTREAMS}%g" \
        "$NGINX_TEMPLATE_FILE_PATH" > "docker/server/conf.template"
fi
