# Setting up a Development Environment

This document details how to set up a local development environment that will allow you to contribute changes to the project!

## Base Requirements

- An IDE such as [Microsoft VS Code IDE](https://code.visualstudio.com/)

## Setup Git Repository Fork

You will push changes to a fork of the Langboard repository, and from there create a Pull Request into the project repository.

Fork the [Langboard GitHub repository](https://github.com/yamonco/langboard), and follow the instructions to create a new fork.

On your new fork, click the "<> Code" button to get a URL to clone using your preferred method, and clone the repository; for example using https:

```bash
git clone https://github.com/<your username>/langboard.git
```

Finally, add the Project repository as upstream:

```bash
cd langboard
git remote add upstream https://github.com/yamonco/langboard.git
git remote set-url --push upstream no_push
```

> [!TIP]
> Windows/WSL Users: You may find that files **change**, specifically the file mode e.g. **changed file mode 100755 → 100644**. You can workaround this problem with `git config core.filemode false`.

## Set up Environment

### Install Pre-Requisites

- `git`: The project uses the ubiquitous `git` tool for change control.
  - For Windows users, you can use [Git Windows](https://git-scm.com/downloads/win)
- `make`: The project uses `make` to coordinate packaging.
  - For Windows users, you have multiple choices to install `make`. However, our guide provides the installation via `scoop`
    1. If your computer doesn't have `scoop`, you must install [scoop](https://scoop.sh/)
    2. Run command
    ```bash
    scoop install make
    ```
- `uv`: The project uses `uv` to coordinate `flows` packaging, a Python package and project manager from Astral. Install instructions at [uv](https://docs.astral.sh/uv/getting-started/installation/).
- `Yarn`: The `ui`, the `socket`, and the `ts/core` are built with Node.js (`v22 LTS`) and `yarn` (`v1.22`). Install instructions at [Node.js](https://nodejs.org/en/download), and [Yarn](https://classic.yarnpkg.com/lang/en/docs/install)
- `Docker` and `Docker Compose`: The project uses Docker to containerize and manage services, ensuring consistency across development and production environments.
  - On Windows, Docker Desktop requires `WSL` and must be installed accordingly. For installation of them, you can visit [Docker](https://docs.docker.com/desktop/setup/install/windows-install/)

If you want to develop related to email services, you should prepare SMTP settings.

- For Windows users, there is a fake smtp service running on local environment.
  - [Papercut](https://github.com/ChangemakerStudios/Papercut-SMTP)

### Initial Environment Validation and Setup

To setup and validate the initial environment, run:

```bash
make init
```

## Set Environment Variables

- Your `.env` file will be located to the root of the project after you set up.
- You can see the variable table [here](#environmnet-variables)

## Start local development

If you don't install `nodemon` globally, you should install `nodemon` for watching socket.

```bash
yarn global add nodemon
npm i -g nodemon  // Some computers can't find nodemon even if installed nodemon through Yarn
```

You should prepare 6 bash terminals for hot-reload systems.

- `api`

```bash
make dev_api
```

- `flows`

```bash
make dev_flows
```

- `ts/core`

```bash
make dev_ts_core_build
```

- `socket`

  - For build,

  ```bash
  make dev_socket_build
  ```

  - For watching the built files

  ```bash
  make dev_socket
  ```

- `ui`

```bash
make dev_ui
```

## Start docker

You must set required [environment variables](#environmnet-variables)

```bash
make start_docker

# If you want to recreate containers without building images
# Usually, it is used when the environment variables are updated
make update_docker

# If you want to stop
make stop_docker
```

- If you want to use `docs`

```bash
make start_docker WITH_DOCS=true

# If you want to rebuild specific image(s)
# You can use below
make rebuild_docker IMAGES=single_image WITH_DOCS=true
make rebuild_docker IMAGES="multiple_image1 multiple_image2" WITH_DOCS=true

# If you want to recreate containers without building images
# Usually, it is used when the environment variables are updated
make update_docker WITH_DOCS=true

# If you want to stop
make stop_docker WITH_DOCS=true
```

- If you want to use `ui watcher`

```bash
make start_docker WITH_UI_WATCHER=true

# If you want to rebuild specific image(s)
# You can use below
make rebuild_docker IMAGES=single_image WITH_UI_WATCHER=true
make rebuild_docker IMAGES="multiple_image1 multiple_image2" WITH_UI_WATCHER=true

# If you want to recreate containers without building images
# Usually, it is used when the environment variables are updated
make update_docker WITH_UI_WATCHER=true

# If you want to stop
make stop_docker WITH_UI_WATCHER=true
```

- If you want to use `ollama`

  - `CPU`

  ```bash
  make start_docker WITH_OLLAMA_CPU=true

  # If you want to rebuild specific image(s)
  # You can use below
  make rebuild_docker IMAGES=single_image WITH_OLLAMA_CPU=true
  make rebuild_docker IMAGES="multiple_image1 multiple_image2" WITH_OLLAMA_CPU=true

  # If you want to recreate containers without building images
  # Usually, it is used when the environment variables are updated
  make update_docker WITH_OLLAMA_CPU=true

  # If you want to stop
  make stop_docker WITH_OLLAMA_CPU=true
  ```

  - `GPU`

  ```bash
  make start_docker WITH_OLLAMA_GPU=true

  # If you want to rebuild specific image(s)
  # You can use below
  make rebuild_docker IMAGES=single_image WITH_OLLAMA_GPU=true
  make rebuild_docker IMAGES="multiple_image1 multiple_image2" WITH_OLLAMA_GPU=true

  # If you want to recreate containers without building images
  # Usually, it is used when the environment variables are updated
  make update_docker WITH_OLLAMA_GPU=true

  # If you want to stop
  make stop_docker WITH_OLLAMA_GPU=true
  ```

You can combine those options, for example:

```bash
make start_docker WITH_DOCS=true WITH_UI_WATCHER=true WITH_OLLAMA_GPU=true

# If you want to rebuild specific image(s)
# You can use below
make rebuild_docker IMAGES=single_image WITH_DOCS=true WITH_UI_WATCHER=true WITH_OLLAMA_GPU=true
make rebuild_docker IMAGES="multiple_image1 multiple_image2" WITH_DOCS=true WITH_UI_WATCHER=true WITH_OLLAMA_GPU=true

# If you want to recreate containers without building images
# Usually, it is used when the environment variables are updated
make update_docker WITH_DOCS=true WITH_UI_WATCHER=true WITH_OLLAMA_GPU=true

# If you want to stop
make stop_docker WITH_DOCS=true WITH_UI_WATCHER=true WITH_OLLAMA_GPU=true
```

## Environmnet Variables

| Key                            | Type                  | Description                                                                                                                     |
| ------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| ADMIN_EMAIL                    | **string**            | To add admin account if the account doesn't exist.                                                                              |
| ADMIN_PASSWORD                 | **string**            |                                                                                                                                 |
| NGINX_UI_EXPOSE_PORT           | **int**               | Used to run docker to expose `ui`                                                                                               |
| NGINX_SOCKET_EXPOSE_PORT       | **int**               | Used to run docker to expose `socket`                                                                                           |
| NGINX_API_EXPOSE_PORT          | **int**               | Used to run docker to expose `api`                                                                                              |
| DOCS_EXPOSE_PORT               | **int (Optional)**    | Used to run docker to expose `docs` if you use `docs`                                                                           |
| REDIS_PORT                     | **int**               | Used to run docker to build `redis`                                                                                             |
| REDIS_PASSWORD                 | **string**            |                                                                                                                                 |
| REDIS_LOG_DIR                  | **string**            |                                                                                                                                 |
| REDIS_LOG_FILE                 | **string**            |                                                                                                                                 |
| CACHE_TYPE                     | **enum**              | `in-memory`, `redis`                                                                                                            |
| CACHE_URL                      | **string**            | You don't need to set if you run docker or run in local environment                                                             |
| BROADCAST_TYPE                 | **enum**              | `in-memory`, `kafka`                                                                                                            |
| BROADCAST_URLS                 | **array**             | Separator: `,`                                                                                                                  |
| API_PORT                       | **int**               | Default: `5381`                                                                                                                 |
| API_WORKERS_COUNT              | **int**               | Default: `1`<br>Used to run docker to build `api`                                                                               |
| SOCKET_PORT                    | **int**               | Default: `5690`                                                                                                                 |
| FLOWS_PORT                     | **int**               | Default: `5019`                                                                                                                 |
| FLOWS_WORKERS_COUNT            | **int**               | Default: `1`<br>Used to run docker to build `flows`                                                                             |
| MAX_FILE_SIZE_MB               | **int**               | Default: `50`                                                                                                                   |
| AI_REQUEST_TIMEOUT             | **int**               | Default: `120`<br>Value must be set in seconds                                                                                  |
| AI_REQUEST_TRIALS              | **int**               | Default: `5`                                                                                                                    |
| TERMINAL_LOGGING_LEVEL         | **enum (Optional)**   | Default: `AUTO`<br>(See [Log level enum](#log-level-enum))                                                                      |
| FILE_LOGGING_LEVEL             | **enum (Optional)**   | Default: `AUTO`<br>(See [Log level enum](#log-level-enum))                                                                      |
| LOGGING_DIR                    | **string (Optional)** | Logging directory path for `api`                                                                                                |
| SOCKET_LOGGING_DIR             | **string (Optional)** | Logging directory path for `socket`                                                                                             |
| SENTRY_DSN                     | **string (Optional)** | Sentry dsn url if you want to trace errors                                                                                      |
| LOCAL_STORAGE_DIR              | **string (Optional)** | Uploading direcotory path                                                                                                       |
| S3_ACCESS_KEY_ID               | **string (Optional)** | Set if you want to use AWS S3                                                                                                   |
| S3_SECRET_ACCESS_KEY           | **string (Optional)** |                                                                                                                                 |
| S3_REGION_NAME                 | **string (Optional)** |                                                                                                                                 |
| S3_BUCKET_NAME                 | **string (Optional)** |                                                                                                                                 |
| MAIL_FROM                      | **string (Optional)** | Required if you allow other users can sign up                                                                                   |
| MAIL_FROM_NAME                 | **string (Optional)** |                                                                                                                                 |
| MAIL_USERNAME                  | **string (Optional)** |                                                                                                                                 |
| MAIL_PASSWORD                  | **string (Optional)** |                                                                                                                                 |
| MAIL_SERVER                    | **string (Optional)** |                                                                                                                                 |
| MAIL_PORT                      | **int (Optional)**    |                                                                                                                                 |
| MAIL_STARTTLS                  | **bool (Optional)**   |                                                                                                                                 |
| MAIL_SSL_TLS                   | **bool (Optional)**   |                                                                                                                                 |
| COMMON_SECRET_KEY              | **string**            | Used to create public tokens                                                                                                    |
| JWT_SECRET_KEY                 | **string**            | Used to create json web tokens(JWT)                                                                                             |
| JWT_ALGORITHM                  | **enum**              | Default: `HS256`<br>(See [JWT algorithm enum](#jwt-algorithm-enum))                                                             |
| JWT_AT_EXPIRATION              | **int (Optional)**    | Default: `10800`<br>Value must be set in seconds                                                                                |
| JWT_RT_EXPIRATION              | **int (Optional)**    | Default: `30`<br>Value must be set in days                                                                                      |
| CRON_TAB_FILE                  | **string (Optional)** | Used to cron in docker container                                                                                                |
| UI_PORT                        | **int**               | Default: `5173`                                                                                                                 |
| SOCKET_URL                     | **string (Optional)** | If you use domain, you must set the domain.<br>If you use docker **locally**, you must put **ip address** with the exposed port |
| API_URL                        | **string (Optional)** |                                                                                                                                 |
| PUBLIC_UI_URL                  | **string (Optional)** |                                                                                                                                 |
| DOMAIN                         | **string (Optional)** | If you use subdomains for the urls above, you must set as `.your.domain`.<br>DO NOT ADD **wildcard** in head                    |
| DB_TIMEOUT                     | **int (Optional)**    | Default: `120`<br>Value must be set in seconds                                                                                  |
| DB_TCP_USER_TIMEOUT            | **int (Optional)**    | Default: `1000`<br>Value must be set in milliseconds                                                                            |
| POSTGRES_USER                  | **string**            | Used to run docker to build `postgresql`                                                                                        |
| POSTGRES_PASSWORD              | **string**            |                                                                                                                                 |
| POSTGRES_REPLICATION_USER      | **string**            |                                                                                                                                 |
| POSTGRES_REPLICATION_PASSWORD  | **string**            |                                                                                                                                 |
| POSTGRES_DB                    | **string**            |                                                                                                                                 |
| MASTER_POSTGRES_PORT           | **int**               |                                                                                                                                 |
| REPLICA_POSTGRES_PORT          | **int**               |                                                                                                                                 |
| POSTGRES_MAX_CONNECTIONS       | **int**               |                                                                                                                                 |
| PGBOUNCER_SERVER_IDLE_TIMEOUT  | **int**               |                                                                                                                                 |
| PGBOUNCER_CLIENT_IDLE_TIMEOUT  | **int**               |                                                                                                                                 |
| PGBOUNCER_DEFAULT_POOL_SIZE    | **int**               |                                                                                                                                 |
| PGBOUNCER_RESERVE_POOL_TIMEOUT | **int**               |                                                                                                                                 |
| PGBOUNCER_QUERY_WAIT_TIMEOUT   | **int**               |                                                                                                                                 |
| KAFKA_CLUSTER_ID               | **string**            | Used to run docker to build `kafka`                                                                                             |
| OLLAMA_API_URL                 | **string**            | Used to run docker to build `ollama`<br>Required if you run docker compose with `ollama` option                                 |
| OLLAMA_KEEP_ALIVE              | **string**            | Value must be written in human-readable time format (eg. 30m)                                                                   |

### Log level enum

- AUTO
- CRITICAL
- ERROR
- WARNING
- INFO
- DEBUG
- NOTSET

### JWT algorithm enum

- ES256
- ES384
- ES512
- ES256K
- RS256
- HS256
- EdDSA
