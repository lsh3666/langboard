$CURRENT_DIR = (Get-Location).Path.Split('\')[-1]

if ($CURRENT_DIR -eq "langboard" -and (Test-Path -Path ".\docker")) {
    Set-Location -Path "docker"
} elseif ($CURRENT_DIR -ne "docker") {
    Write-Host "You must run this script from the langboard root directory or the docker directory."
    exit 1
}

Set-Location -Path ".."

$CURRENT_DIR = (Get-Location).Path

& "$CURRENT_DIR\scripts\run_docker_compose.ps1" "ollama-cpu"