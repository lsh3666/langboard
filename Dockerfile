FROM python:3.12 AS base

WORKDIR /app

ENV PIP_DISABLE_PIP_VERSION_CHECK=on
ENV UV_HTTP_TIMEOUT=120

RUN apt-get update && apt-get install -y
RUN apt update && apt install -y
RUN apt install libuv1-dev libssl-dev systemd build-essential curl ca-certificates tar -y
RUN rm -rf /var/lib/apt/lists/*

ADD https://astral.sh/uv/install.sh /uv-installer.sh

RUN sh /uv-installer.sh && rm /uv-installer.sh

ENV PATH="/root/.local/bin/:$PATH"

RUN uv --version

COPY ./src/api ./src/api
COPY ./src/shared/py ./src/shared/py
COPY pyproject.toml uv.lock README.md alembic.ini ./

RUN uv venv
RUN uv pip install .

FROM base AS with-cron
ARG CRON_TAB_FILE

RUN apt-get update && apt-get install -y cron
RUN crontab $CRON_TAB_FILE
RUN cron
