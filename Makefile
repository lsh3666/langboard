.PHONY: help init format lint start_docker stop_docker rebuild_docker update_docker

COMPOSE_PREFIX := ./docker/docker-compose
COMPOSE_ARGS := -f $(COMPOSE_PREFIX).kafka.yaml -f $(COMPOSE_PREFIX).pg.yaml -f $(COMPOSE_PREFIX).redis.yaml -f $(COMPOSE_PREFIX).server.yaml --env-file ./.env
DOCS_COMPOSE_ARGS := -f $(COMPOSE_PREFIX).docs.yaml
UI_WATCHER_COMPOSE_ARGS := -f $(COMPOSE_PREFIX).ui-watcher.yaml
OLLAMA_SHARED_COMPOSE_ARGS := -f $(COMPOSE_PREFIX).ollama.shared.yaml
OLLAMA_CPU_COMPOSE_ARGS := -f $(COMPOSE_PREFIX).ollama.cpu.yaml $(OLLAMA_SHARED_COMPOSE_ARGS)
OLLAMA_GPU_COMPOSE_ARGS := -f $(COMPOSE_PREFIX).ollama.gpu.yaml $(OLLAMA_SHARED_COMPOSE_ARGS)
UI_DIR := src/ui
API_DIR := src/api
FLOWS_DIR := src/flows
SOCKET_DIR := src/socket
TS_CORE_DIR := src/shared/ts
GREEN := \033[0;32m
RED := \033[0;31m
CYAN := \033[0;36m
DIM := \033[2m
BOLD := \033[1m
NC := \033[0m

COMPOSE_ARGS := $(COMPOSE_ARGS)
WITH_DOCS ?= false
WITH_UI_WATCHER ?= false
WITH_OLLAMA_CPU ?= false
WITH_OLLAMA_GPU ?= false

ifeq ($(WITH_DOCS), true)
	COMPOSE_ARGS += $(DOCS_COMPOSE_ARGS)
endif
ifeq ($(WITH_UI_WATCHER), true)
	COMPOSE_ARGS += $(UI_WATCHER_COMPOSE_ARGS)
endif
ifeq ($(WITH_OLLAMA_CPU), true)
	COMPOSE_ARGS += $(OLLAMA_CPU_COMPOSE_ARGS)
endif
ifeq ($(WITH_OLLAMA_GPU), true)
	COMPOSE_ARGS += $(OLLAMA_GPU_COMPOSE_ARGS)
endif


check_tools:
	@command -v poetry >/dev/null 2>&1 || { echo >&2 "$(RED)Poetry is not installed. Aborting.$(NC)"; exit 1; }
	@command -v yarn >/dev/null 2>&1 || { echo >&2 "$(RED)Yarn is not installed. Aborting.$(NC)"; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo >&2 "$(RED)Docker is not installed. Aborting.$(NC)"; exit 1; }
	@command -v docker compose >/dev/null 2>&1 || { echo >&2 "$(RED)Docker Compose is not installed. Aborting.$(NC)"; exit 1; }
	@command -v pipx >/dev/null 2>&1 || { echo >&2 "$(RED)pipx is not installed. Aborting.$(NC)"; exit 1; }
	@command -v uv >/dev/null 2>&1 || { echo >&2 "$(RED)uv is not installed. Aborting.$(NC)"; exit 1; }
	@printf "$(GREEN)All required tools are installed.$(NC)"

help: ## show this help message
	@echo ''
	@printf '$(BOLD)Available targets$(NC):\n'
	@echo '----------------------------------------------------------------------'
	@grep -hE '^\S+:.*##' $(MAKEFILE_LIST) | \
	awk -F ':.*##' '{printf "$(CYAN) %s$(NC): $(DIM)%s$(NC)\n", $$1, $$2}' | \
	column -c2 -t -s :
	@echo '----------------------------------------------------------------------'
	@echo ''
	@printf 'Command: $(CYAN)$(BOLD)make <target> [options]$(NC)\n'

format: ## run code formatters
	poetry run ruff check . --fix
	poetry run ruff format .
	cd $(FLOWS_DIR) && uv run ruff check . --fix
	cd $(FLOWS_DIR) && uv run ruff format .
	cd $(TS_CORE_DIR) && yarn run format
	cd $(UI_DIR) && yarn run format
	cd $(SOCKET_DIR) && yarn run format

lint: ## run linters
	poetry run ruff check .
	cd $(FLOWS_DIR) && uv run ruff check .
	cd $(TS_CORE_DIR) && yarn run lint
	cd $(UI_DIR) && yarn run lint
	cd $(SOCKET_DIR) && yarn run lint

init: check_tools clean_python_cache clean_ts_core_cache clean_ui_cache clean_socket_cache ## initialize the project
	make install_api
	make install_ts_core
	make install_ui
	make install_flows
	make install_socket
	make init_env
	@printf "$(GREEN)All requirements are installed.$(NC)"

install_api: ## install the api dependencies
	@echo 'Installing api dependencies'
	@poetry install

install_ts_core: ## install the ts core dependencies
	@echo 'Installing ts core dependencies'
	cd $(TS_CORE_DIR) && yarn run format
	cd $(TS_CORE_DIR) && yarn install
	cd $(TS_CORE_DIR) && yarn run build

install_ui: ## install ui dependencies
	@echo 'Installing ui dependencies'
	cd $(UI_DIR) && yarn run format
	cd $(UI_DIR) && yarn install

install_flows: ## install flows dependencies
	@echo 'Installing flows dependencies'
	cd $(FLOWS_DIR) && uv venv && uv pip install .

install_socket: ## install socket dependencies
	@echo 'Installing socket dependencies'
	cd $(SOCKET_DIR) && yarn run format
	cd $(SOCKET_DIR) && yarn install

dev_api: ## run the API in development environment
	langboard run -w

dev_ts_core_build: ## build the shared core in development environment
	cd $(TS_CORE_DIR) && yarn run build -w

dev_ui: ## run the UI in development environment
	cd $(UI_DIR) && yarn run dev

dev_flows: ## run the Flows in development environment
	cd $(FLOWS_DIR) && uv run flows run -w

dev_socket: ## run the Socket in development environment
	cd $(SOCKET_DIR) && nodemon dist/index.js

dev_socket_build: ## build the Socket in development environment
	cd $(SOCKET_DIR) && yarn run build -w

start_docker: ## run Docker in the production environment
	make init_env
	make update_docker_settings
	mkdir -p ./docker/volumes
	docker compose -f $(COMPOSE_PREFIX).yaml $(COMPOSE_ARGS) up -d --build --remove-orphans

rebuild_docker: ## run Docker in the production environment (e.g. make rebuild_docker IMAGES=image_name or IMAGES="image_name1 image_name2")
	if [ "$(IMAGES)" = "" ]; then \
		echo "$(RED)Please specify the IMAGES variable to rebuild (e.g. make rebuild_docker IMAGES=image_name or IMAGES=\"image_name1 image_name2\")$(NC)"; \
		exit 1; \
	fi

	make init_env
	make update_docker_settings
	mkdir -p ./docker/volumes
	docker compose -f $(COMPOSE_PREFIX).yaml $(COMPOSE_ARGS) up -d --build ${IMAGES} --remove-orphans

update_docker: ## update Docker in the production environment
	make init_env
	make update_docker_settings
	docker compose -f $(COMPOSE_PREFIX).yaml $(COMPOSE_ARGS) up -d --no-deps --force-recreate --remove-orphans

stop_docker: ## stop Docker in the production environment
	docker compose -f $(COMPOSE_PREFIX).yaml $(COMPOSE_ARGS) down --rmi all --volumes --remove-orphans

unit_tests: ## run unit tests
	poetry run pytest $(API_DIR)/tests/units

cov_unit_tests: ## run unit tests with coverage
	poetry run pytest -vv --cov=$(API_DIR)/langboard $(API_DIR)/tests/units --cov-report=html:./$(API_DIR)/coverage
	@printf "$(GREEN)Coverage report generated in $(API_DIR)/coverage directory.$(NC)"

init_env: ## initialize the .env file from .env.example if it does not exist
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
	fi

update_docker_settings: ## update Docker settings
	bash ./scripts/dockerutils/scale-docker-api.sh
	bash ./scripts/dockerutils/update-docker-envs.sh

clean_python_cache: ## clean Python cache
	@echo "Cleaning Python cache..."
	find . -not -path "*/.venv/*" -type d -name '__pycache__' -exec rm -r {} +
	find . -not -path "*/.venv/*" -type f -name '*.py[cod]' -exec rm -f {} +
	find . -not -path "*/.venv/*" -type f -name '*~' -exec rm -f {} +
	find . -not -path "*/.venv/*" -type f -name '.*~' -exec rm -f {} +
	@printf "$(GREEN)Python cache cleaned.$(NC)"

clean_ts_core_cache: ## clean Yarn cache
	@echo "Cleaning ts core cache..."
	cd $(TS_CORE_DIR) && yarn cache clean --force
	rm -rf $(TS_CORE_DIR)/node_modules $(TS_CORE_DIR)/dist $(TS_CORE_DIR)/.rollup.cache
	@printf "$(GREEN)Yarn cache and ts core directories cleaned.$(NC)"

clean_ui_cache: ## clean Yarn cache
	@echo "Cleaning ui cache..."
	cd $(UI_DIR) && yarn cache clean --force
	rm -rf $(UI_DIR)/node_modules $(UI_DIR)/build
	@printf "$(GREEN)Yarn cache and ui directories cleaned.$(NC)"

clean_socket_cache: ## clean Socket cache
	@echo "Cleaning socket cache..."
	cd $(SOCKET_DIR) && yarn cache clean --force
	rm -rf $(SOCKET_DIR)/node_modules $(SOCKET_DIR)/dist $(SOCKET_DIR)/.rollup.cache
	@printf "$(GREEN)Socket cache and directories cleaned.$(NC)"
