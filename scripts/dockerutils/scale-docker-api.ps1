$CURRENT_DIR = (Get-Location).Path.Split('\')[-1]

if ($CURRENT_DIR -eq "langboard" -and (Test-Path -Path ".\docker")) {
    Set-Location -Path "docker"
} elseif ($CURRENT_DIR -ne "docker") {
    Write-Host "You must run this script from the langboard root directory or the docker directory."
    exit 1
}

Set-Location -Path ".."

$envFile = ".env"
$env = @{}
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#;][^=]+)=(.*)$') {
            $env[$matches[1].Trim()] = $matches[2].Trim()
        }
    }
}

$API_WORKERS_COUNT = if ($env.ContainsKey('API_WORKERS_COUNT') -and [int]::TryParse($env['API_WORKERS_COUNT'], [ref]$null)) { [int]$env['API_WORKERS_COUNT'] } else { 1 }
$API_WORKERS_COUNT = [math]::Max(0, $API_WORKERS_COUNT) - 1

$TEMPLATE_FILE_PATH = 'docker\docker-compose.server.yaml.template'
$API_TEMPLATE_FILE_PATH = 'docker\docker-compose.server.api.yaml.template'
$NGINX_TEMPLATE_FILE_PATH = 'docker\server\conf-scale.template'
$OUTPUT_FILE_PATH = 'docker\docker-compose.server.yaml'
$NGINX_OUTPUT_FILE_PATH = 'docker\server\conf.template'

$API_TEMPLATE_CONTENT = Get-Content $API_TEMPLATE_FILE_PATH -Raw

$CONTAINERS = ''
$CONTAINER_NAMES = ''
$NGINX_UPSTREAMS = ''

if ($API_WORKERS_COUNT -lt 0) {
    $API_WORKERS_COUNT = 0
} else {
    for ($i = 0; $i -le $API_WORKERS_COUNT; $i++) {
        $containerName = "api-$i"
        $CONTAINERS += $API_TEMPLATE_CONTENT -replace '{{index}}', $i
        $CONTAINERS += "`n"

        if ($i -ne 0) {
            $CONTAINER_NAMES += "`n"
        }
        $CONTAINER_NAMES += "      - $containerName"

        if ($i -ne 0) {
            $NGINX_UPSTREAMS += "`n"
        }
        $NGINX_UPSTREAMS += "    server "
        $NGINX_UPSTREAMS += "$"
        $NGINX_UPSTREAMS += "{API_HOST}_${i}:"
        $NGINX_UPSTREAMS += "$"
        $NGINX_UPSTREAMS += "{API_PORT};"
    }
}

$TEMPLATE_CONTENT = Get-Content $TEMPLATE_FILE_PATH -Raw
$FINAL_CONTENT = $TEMPLATE_CONTENT -replace '{{API_WORKER_CONTAINERS}}', $CONTAINERS -replace '{{API_WORKER_CONTAINER_NAMES}}', $CONTAINER_NAMES
Set-Content -Path $OUTPUT_FILE_PATH -Value $FINAL_CONTENT -Encoding UTF8

$NGINX_TEMPLATE_CONTENT = Get-Content $NGINX_TEMPLATE_FILE_PATH -Raw
$FINAL_NGINX_CONTENT = $NGINX_TEMPLATE_CONTENT -replace '{{UPSTREAM_APIS}}', $NGINX_UPSTREAMS
Set-Content -Path $NGINX_OUTPUT_FILE_PATH -Value $FINAL_NGINX_CONTENT -Encoding UTF8