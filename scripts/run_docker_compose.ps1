[System.Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($null -eq $docker) {
    Write-Host "Docker is not installed or not found in PATH. Please install Docker to proceed."
    Write-Host "You can download it from https://docs.docker.com/desktop/setup/install/windows-install/"
    Pause
    Exit 1
}

$COMPOSE_PREFIX = ".\docker\docker-compose"
$COMPOSE_ARGS = "-f $COMPOSE_PREFIX.kafka.yaml -f $COMPOSE_PREFIX.pg.yaml -f $COMPOSE_PREFIX.redis.yaml -f $COMPOSE_PREFIX.server.yaml --env-file .\.env"
$DOCS_COMPOSE_ARGS = "-f $COMPOSE_PREFIX.docs.yaml"
$UI_WATCHER_COMPOSE_ARGS = "-f $COMPOSE_PREFIX.ui-watcher.yaml"
$OLLAMA_SHARED_COMPOSE_ARGS = "-f $COMPOSE_PREFIX.ollama.shared.yaml"
$OLLAMA_CPU_COMPOSE_ARGS = "-f $COMPOSE_PREFIX.ollama.cpu.yaml $OLLAMA_SHARED_COMPOSE_ARGS"
$OLLAMA_GPU_COMPOSE_ARGS = "-f $COMPOSE_PREFIX.ollama.gpu.yaml $OLLAMA_SHARED_COMPOSE_ARGS"

foreach ($arg in $args) {
    if ($arg -eq "docs") {
        $COMPOSE_ARGS += " $DOCS_COMPOSE_ARGS"
    }
    elseif ($arg -eq "ui-watcher") {
        $COMPOSE_ARGS += " $UI_WATCHER_COMPOSE_ARGS"
    }
    elseif ($arg -eq "ollama-cpu") {
        $COMPOSE_ARGS += " $OLLAMA_CPU_COMPOSE_ARGS"
    }
    elseif ($arg -eq "ollama-gpu") {
        $COMPOSE_ARGS += " $OLLAMA_GPU_COMPOSE_ARGS"
    }
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env" -Force | Out-Null
}

& ".\dockerutils\scale-docker-api.ps1"

docker compose -f "$COMPOSE_PREFIX.yaml" $COMPOSE_ARGS up -d --build

Write-Host ""
Pause
