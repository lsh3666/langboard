FROM python:3.12

WORKDIR /app/src/flows

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

COPY ./langboard_flows ./langboard_flows
COPY pyproject.toml uv.lock ./

RUN uv venv

RUN uv pip install .
