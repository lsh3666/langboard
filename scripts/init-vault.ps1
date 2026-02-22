$ErrorActionPreference = "Stop"

# Load .env file
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$EnvFile = Join-Path $ProjectRoot ".env"

if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value
        }
    }
}

$VaultAddr = if ($env:KEY_PROVIDER_HASHICORP_URL) { $env:KEY_PROVIDER_HASHICORP_URL } else { "http://127.0.0.1:8200" }
$ProjectName = if ($env:PROJECT_NAME) { $env:PROJECT_NAME } else { "langboard" }
$RoleName = "${ProjectName}-role"
$CredentialsFile = ".vault-credentials"

Write-Host "🔐 HashiCorp Vault Local Initialization Script (HTTP API)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Vault Address: $VaultAddr"
Write-Host ""

# Check if KEY_PROVIDER_HASHICORP_ROOT_TOKEN is set
if (-not $env:KEY_PROVIDER_HASHICORP_ROOT_TOKEN) {
    Write-Host "❌ Error: KEY_PROVIDER_HASHICORP_ROOT_TOKEN environment variable not set" -ForegroundColor Red
    Write-Host "   Start Vault in dev mode:" -ForegroundColor White
    Write-Host "   .\vault.exe server -dev -dev-root-token-id=\"test\"" -ForegroundColor White
    Write-Host "   Then add to .env file:" -ForegroundColor White
    Write-Host "   KEY_PROVIDER_HASHICORP_ROOT_TOKEN=test" -ForegroundColor Yellow
    exit 1
}

# Check if vault is running
Write-Host "🔍 Checking if Vault is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$VaultAddr/v1/sys/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -notin @(200, 429)) {
        throw "Vault not responding correctly"
    }
    Write-Host "✅ Vault is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Vault is not running at $VaultAddr" -ForegroundColor Red
    Write-Host "   Start Vault in dev mode first" -ForegroundColor White
    exit 1
}
Write-Host ""

# Headers for authenticated requests
$headers = @{
    "X-Vault-Token" = $env:KEY_PROVIDER_HASHICORP_ROOT_TOKEN
}

# Enable AppRole auth method if not already enabled
Write-Host "🔧 Configuring AppRole authentication..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$VaultAddr/v1/sys/auth/approle" -Headers $headers -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ AppRole already enabled" -ForegroundColor Green
    }
} catch {
    try {
        $body = @{
            type = "approle"
        } | ConvertTo-Json

        Invoke-RestMethod -Uri "$VaultAddr/v1/sys/auth/approle" -Method Post -Headers $headers -Body $body -ContentType "application/json" | Out-Null
        Write-Host "✅ AppRole enabled" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error enabling AppRole: $_" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Create policy for apikeys
Write-Host "🔧 Creating policy for apikeys..." -ForegroundColor Yellow
try {
    $policy = @"
path "apikeys/data/*" {
  capabilities = ["create", "update", "read"]
}

path "apikeys/metadata/*" {
  capabilities = ["create", "update", "delete", "list"]
}

path "apikeys/delete/*" {
  capabilities = ["update"]
}
"@

    $policyBody = @{
        policy = $policy
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "$VaultAddr/v1/sys/policy/apikeys-policy" -Method Post -Headers $headers -Body $policyBody -ContentType "application/json" | Out-Null
    Write-Host "✅ Policy created" -ForegroundColor Green
} catch {
    Write-Host "❌ Error creating policy: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Create or update the role
Write-Host "🔧 Creating/updating AppRole: $RoleName" -ForegroundColor Yellow
try {
    $body = @{
        token_policies = "apikeys-policy"
        token_ttl = "1h"
        token_max_ttl = "4h"
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "$VaultAddr/v1/auth/approle/role/$RoleName" -Method Post -Headers $headers -Body $body -ContentType "application/json" | Out-Null
    Write-Host "✅ Role created/updated" -ForegroundColor Green
} catch {
    Write-Host "❌ Error creating role: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Get role_id
Write-Host "📋 Retrieving Role ID..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$VaultAddr/v1/auth/approle/role/$RoleName/role-id" -Headers $headers -Method Get
    $RoleId = $response.data.role_id
    Write-Host "   Role ID: $RoleId" -ForegroundColor White
} catch {
    Write-Host "❌ Error retrieving role ID: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Generate secret_id
Write-Host "📋 Generating Secret ID..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$VaultAddr/v1/auth/approle/role/$RoleName/secret-id" -Headers $headers -Method Post
    $SecretId = $response.data.secret_id
    Write-Host "   Secret ID: $SecretId" -ForegroundColor White
} catch {
    Write-Host "❌ Error generating secret ID: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Enable KV v2 secrets engine for apikeys if not already enabled
Write-Host "🔧 Configuring KV v2 secrets engine..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$VaultAddr/v1/sys/mounts/apikeys" -Headers $headers -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ KV v2 secrets engine already mounted at apikeys/" -ForegroundColor Green
    }
} catch {
    try {
        $body = @{
            type = "kv-v2"
        } | ConvertTo-Json

        Invoke-RestMethod -Uri "$VaultAddr/v1/sys/mounts/apikeys" -Method Post -Headers $headers -Body $body -ContentType "application/json" | Out-Null
        Write-Host "✅ KV v2 secrets engine mounted at apikeys/" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error enabling KV v2: $_" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Write credentials to .vault-credentials file
Write-Host "💾 Writing credentials to $CredentialsFile..." -ForegroundColor Yellow
try {
    @"
VAULT_ROLE_ID=$RoleId
VAULT_SECRET_ID=$SecretId
"@ | Out-File -FilePath $CredentialsFile -Encoding ASCII

    # Set file permissions (read/write for owner only on Windows)
    $acl = Get-Acl $CredentialsFile
    $acl.SetAccessRuleProtection($true, $false)
    $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        $env:USERNAME,
        "Read,Write",
        "None",
        "None",
        "Allow"
    )
    $acl.SetAccessRule($accessRule)
    Set-Acl $CredentialsFile $acl

    Write-Host "✅ Credentials file created" -ForegroundColor Green
} catch {
    Write-Host "❌ Error writing credentials file: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test the credentials
Write-Host "🧪 Testing AppRole authentication..." -ForegroundColor Yellow
try {
    $testBody = @{
        role_id = $RoleId
        secret_id = $SecretId
    } | ConvertTo-Json

    $testResponse = Invoke-RestMethod -Uri "$VaultAddr/v1/auth/approle/login" -Method Post -Body $testBody -ContentType "application/json"

    if ($testResponse.auth.client_token) {
        Write-Host "✅ AppRole authentication successful!" -ForegroundColor Green
    } else {
        throw "Authentication failed - no token in response"
    }
} catch {
    Write-Host "❌ AppRole authentication failed" -ForegroundColor Red
    Write-Host "   $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "✅ HashiCorp Vault initialization complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Credentials saved to: $CredentialsFile" -ForegroundColor White
Write-Host "   ⚠️  IMPORTANT: .vault-credentials is in .gitignore" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔧 Vault configuration:" -ForegroundColor White
Write-Host "   - AppRole: $RoleName" -ForegroundColor White
Write-Host "   - KV v2 secrets: apikeys/" -ForegroundColor White
Write-Host "   - Vault Address: $VaultAddr" -ForegroundColor White
Write-Host ""
Write-Host "🚀 You can now use the application with HashiCorp Vault!" -ForegroundColor Green
