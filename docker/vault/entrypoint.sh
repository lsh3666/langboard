#!/bin/sh
set -e

# Always initialize Vault (force recreation of credentials)
echo "Initializing Vault..."

# Start Vault in background with file storage (persistent)
/usr/local/bin/docker-entrypoint.sh server -dev -dev-root-token-id="${VAULT_TOKEN:-dev-root-token}" -dev-listen-address="0.0.0.0:8200" &
VAULT_PID=$!

echo $VAULT_TOKEN

# Wait for Vault to be ready
echo "Waiting for Vault to start..."
until vault status > /dev/null 2>&1; do
    echo "  Vault not ready yet, waiting..."
    sleep 2
done
echo "Vault is ready"

# 1. Enable KV Secrets Engine v2
echo ""
echo "Enabling KV secrets engine v2..."
vault secrets enable -path=apikeys kv-v2 2>/dev/null || echo "  KV secrets engine already enabled"

# 2. Create policy
echo ""
echo "Creating API key policy..."
vault policy write apikey-policy - <<EOF
# API Key data permissions (KV v2)
path "apikeys/data/*" {
  capabilities = ["create", "read", "update"]
}

# Metadata permissions
path "apikeys/metadata/*" {
  capabilities = ["create", "update", "delete", "list"]
}

# Delete permissions
path "apikeys/delete/*" {
  capabilities = ["update"]
}
EOF
echo "Policy created"

# 3. Create AppRole
echo ""
echo "Creating AppRole for API server..."
vault auth enable approle 2>/dev/null || echo "  AppRole already enabled"

vault write auth/approle/role/api-server-role \
    token_policies="apikey-policy" \
    token_ttl=1h \
    token_max_ttl=4h \
    secret_id_ttl=0

# Extract Role ID and Secret ID
ROLE_ID=$(vault read -field=role_id auth/approle/role/api-server-role/role-id)
SECRET_ID=$(vault write -f -field=secret_id auth/approle/role/api-server-role/secret-id)

echo ""
echo "AppRole created"
echo "   Role ID: ${ROLE_ID}"
echo "   Secret ID: ${SECRET_ID}"

# 4. Create .vault-credentials file
echo ""
echo "Creating .vault-credentials file..."
cat > /vault/.vault-credentials <<EOF
VAULT_ROLE_ID=${ROLE_ID}
VAULT_SECRET_ID=${SECRET_ID}
EOF
chmod 600 /vault/.vault-credentials
echo ".vault-credentials file created with secure permissions"

# 5. Create demo API keys
echo ""
echo "Creating demo API keys..."
vault kv put apikeys/demo-key-1 key_material="demo-api-key-value-1"
vault kv put apikeys/demo-key-2 key_material="demo-api-key-value-2"
echo "Demo keys created"

# 6. Print credentials
echo ""
echo "=========================================="
echo "Credentials saved to .vault-credentials"
echo "=========================================="
echo ""
echo "VAULT_ROLE_ID=${ROLE_ID}"
echo "VAULT_SECRET_ID=${SECRET_ID}"
echo ""

# 7. Check Vault status
echo ""
echo "Vault Status:"
vault status

echo ""
echo "Vault initialization completed"
echo ""
echo "Access Vault UI at: http://localhost:8080"
echo "   Token: dev-root-token"
echo ""

# Wait for the background vault process
wait $VAULT_PID
