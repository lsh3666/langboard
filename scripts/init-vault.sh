#!/bin/bash

set -e

# Load .env file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
fi

KEY_PROVIDER_HASHICORP_URL=${KEY_PROVIDER_HASHICORP_URL:-"http://127.0.0.1:8200"}
PROJECT_NAME=${PROJECT_NAME:-"langboard"}
ROLE_NAME="${PROJECT_NAME}-role"
CREDENTIALS_FILE=".vault-credentials"

echo "🔐 HashiCorp Vault Local Initialization Script (HTTP API)"
echo "=========================================================="
echo "Vault Address: $KEY_PROVIDER_HASHICORP_URL"
echo ""

# Check if KEY_PROVIDER_HASHICORP_ROOT_TOKEN is set
if [ -z "$KEY_PROVIDER_HASHICORP_ROOT_TOKEN" ]; then
    echo "❌ Error: KEY_PROVIDER_HASHICORP_ROOT_TOKEN environment variable not set"
    echo "   Start Vault in dev mode:"
    echo "   .\\vault.exe server -dev -dev-root-token-id=\"test\""
    echo "   Then set in .env file:"
    echo "   KEY_PROVIDER_HASHICORP_ROOT_TOKEN=test"
    exit 1
fi

# Check if vault is running
echo "🔍 Checking if Vault is running..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$KEY_PROVIDER_HASHICORP_URL/v1/sys/health")
if [ "$HEALTH_STATUS" != "200" ] && [ "$HEALTH_STATUS" != "429" ]; then
    echo "❌ Error: Vault is not running at $KEY_PROVIDER_HASHICORP_URL (status: $HEALTH_STATUS)"
    echo "   Start Vault in dev mode first"
    exit 1
fi
echo "✅ Vault is running"
echo ""

# Enable AppRole auth method if not already enabled
echo "🔧 Configuring AppRole authentication..."
APPROLE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "X-Vault-Token: $KEY_PROVIDER_HASHICORP_ROOT_TOKEN" \
    "$KEY_PROVIDER_HASHICORP_URL/v1/sys/auth/approle")

if [ "$APPROLE_STATUS" = "200" ]; then
    echo "✅ AppRole already enabled"
else
    curl -s -X POST \
        -H "X-Vault-Token: $KEY_PROVIDER_HASHICORP_ROOT_TOKEN" \
        -d '{"type": "approle"}' \
        "$KEY_PROVIDER_HASHICORP_URL/v1/sys/auth/approle" > /dev/null
    echo "✅ AppRole enabled"
fi
echo ""

# Create policy for apikeys
echo "🔧 Creating policy for apikeys..."
curl -s -X POST \
    -H "X-Vault-Token: $KEY_PROVIDER_HASHICORP_ROOT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"policy":"path \"apikeys/data/*\" {\n  capabilities = [\"create\", \"update\", \"read\"]\n}\n\npath \"apikeys/metadata/*\" {\n  capabilities = [\"create\", \"update\", \"delete\", \"list\"]\n}\n\npath \"apikeys/delete/*\" {\n  capabilities = [\"update\"]\n}"}' \
    "$KEY_PROVIDER_HASHICORP_URL/v1/sys/policy/apikeys-policy" > /dev/null
echo "✅ Policy created"
echo ""

# Create or update the role
echo "🔧 Creating/updating AppRole: $ROLE_NAME"
curl -s -X POST \
    -H "X-Vault-Token: $KEY_PROVIDER_HASHICORP_ROOT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"token_policies\": \"apikeys-policy\", \"token_ttl\": \"1h\", \"token_max_ttl\": \"4h\"}" \
    "$KEY_PROVIDER_HASHICORP_URL/v1/auth/approle/role/$ROLE_NAME" > /dev/null
echo "✅ Role created/updated"
echo ""

# Get role_id
echo "📋 Retrieving Role ID..."
ROLE_ID=$(curl -s \
    -H "X-Vault-Token: $KEY_PROVIDER_HASHICORP_ROOT_TOKEN" \
    "$KEY_PROVIDER_HASHICORP_URL/v1/auth/approle/role/$ROLE_NAME/role-id" | \
    grep -o '"role_id":"[^"]*"' | \
    cut -d'"' -f4)
echo "   Role ID: $ROLE_ID"
echo ""

# Generate secret_id
echo "📋 Generating Secret ID..."
SECRET_ID=$(curl -s -X POST \
    -H "X-Vault-Token: $KEY_PROVIDER_HASHICORP_ROOT_TOKEN" \
    "$KEY_PROVIDER_HASHICORP_URL/v1/auth/approle/role/$ROLE_NAME/secret-id" | \
    grep -o '"secret_id":"[^"]*"' | \
    cut -d'"' -f4)
echo "   Secret ID: $SECRET_ID"
echo ""

# Enable KV v2 secrets engine for apikeys if not already enabled
echo "🔧 Configuring KV v2 secrets engine..."
KV_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "X-Vault-Token: $KEY_PROVIDER_HASHICORP_ROOT_TOKEN" \
    "$KEY_PROVIDER_HASHICORP_URL/v1/sys/mounts/apikeys")

if [ "$KV_STATUS" = "200" ]; then
    echo "✅ KV v2 secrets engine already mounted at apikeys/"
else
    curl -s -X POST \
        -H "X-Vault-Token: $KEY_PROVIDER_HASHICORP_ROOT_TOKEN" \
        -d '{"type": "kv-v2"}' \
        "$KEY_PROVIDER_HASHICORP_URL/v1/sys/mounts/apikeys" > /dev/null
    echo "✅ KV v2 secrets engine mounted at apikeys/"
fi
echo ""

# Write credentials to .vault-credentials file
echo "💾 Writing credentials to $CREDENTIALS_FILE..."
cat > "$CREDENTIALS_FILE" << EOF
VAULT_ROLE_ID=$ROLE_ID
VAULT_SECRET_ID=$SECRET_ID
EOF

# Set file permissions (read/write for owner only)
chmod 600 "$CREDENTIALS_FILE"
echo "✅ Credentials file created"
echo ""

# Test the credentials
echo "🧪 Testing AppRole authentication..."
TEST_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"role_id\": \"$ROLE_ID\", \"secret_id\": \"$SECRET_ID\"}" \
    "$KEY_PROVIDER_HASHICORP_URL/v1/auth/approle/login")

if echo "$TEST_RESPONSE" | grep -q '"client_token"'; then
    echo "✅ AppRole authentication successful!"
else
    echo "❌ AppRole authentication failed"
    echo "   Response: $TEST_RESPONSE"
    exit 1
fi
echo ""

echo "=========================================================="
echo "✅ HashiCorp Vault initialization complete!"
echo ""
echo "📁 Credentials saved to: $CREDENTIALS_FILE"
echo "   ⚠️  IMPORTANT: .vault-credentials is in .gitignore"
echo ""
echo "🔧 Vault configuration:"
echo "   - AppRole: $ROLE_NAME"
echo "   - KV v2 secrets: apikeys/"
echo "   - Vault Address: $KEY_PROVIDER_HASHICORP_URL"
echo ""
echo "🚀 You can now use the application with HashiCorp Vault!"
