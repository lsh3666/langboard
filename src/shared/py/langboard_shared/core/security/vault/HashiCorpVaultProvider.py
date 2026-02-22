import secrets
from pathlib import Path
from hvac import Client
from hvac.exceptions import VaultError
from ....Env import Env
from .VaultProvider import VaultProvider


class HashiCorpVaultProvider(VaultProvider):
    def __init__(self):
        self.addr = Env.KEY_PROVIDER_HASHICORP_URL

        role_id, secret_id = self._load_vault_credentials()

        if not role_id or not secret_id:
            raise ValueError(
                "Vault credentials not found in .vault-credentials file. "
                "Please ensure VAULT_ROLE_ID and VAULT_SECRET_ID are set."
            )

        try:
            self.client = Client(url=self.addr)
            resp = self.client.auth.approle.login(role_id, secret_id)
            self.client.token = resp["auth"]["client_token"]
        except VaultError as e:
            raise RuntimeError(f"Failed to authenticate or connect to Vault: {e}")

    def name(self) -> str:
        return "hashicorp"

    def create_key(self, key_id: str) -> str:
        key_material = secrets.token_urlsafe(32)
        try:
            self.client.secrets.kv.v2.create_or_update_secret(
                path=key_id, secret={"key_material": key_material}, mount_point="apikeys"
            )
        except VaultError as e:
            if "permission denied" in str(e).lower():
                raise PermissionError(
                    f"Insufficient permissions to create API key in Vault. "
                    f"Ensure the AppRole has write access to 'apikeys' KV v2 secrets engine. "
                    f"Vault error: {e}"
                ) from e
            elif "Invalid path" in str(e):
                raise RuntimeError(
                    f"KV v2 secrets engine 'apikeys' not found in Vault. "
                    f"Please enable it with: vault secrets enable -path=apikeys kv-v2. "
                    f"Vault error: {e}"
                ) from e
            else:
                raise RuntimeError(f"Failed to create API key in Vault: {e}") from e
        return key_material

    def get_key(self, key_id: str) -> str:
        try:
            secret = self.client.secrets.kv.v2.read_secret_version(path=key_id, mount_point="apikeys")
            return secret["data"]["data"]["key_material"]
        except VaultError as e:
            if "permission denied" in str(e).lower():
                raise PermissionError(
                    f"Insufficient permissions to read API key from Vault. "
                    f"Ensure the AppRole has read access to 'apikeys' KV v2 secrets engine. "
                    f"Vault error: {e}"
                ) from e
            elif "Invalid path" in str(e):
                raise KeyError(f"API key '{key_id}' not found in Vault") from e
            else:
                raise RuntimeError(f"Failed to read API key from Vault: {e}") from e

    def delete_key(self, key_id: str):
        try:
            self.client.secrets.kv.v2.delete_metadata_and_all_versions(path=key_id, mount_point="apikeys")
        except VaultError as e:
            if "permission denied" in str(e).lower():
                raise PermissionError(
                    f"Insufficient permissions to delete API key from Vault. "
                    f"Ensure the AppRole has delete access to 'apikeys' KV v2 secrets engine. "
                    f"Vault error: {e}"
                ) from e
            elif "Invalid path" in str(e):
                pass
            else:
                raise RuntimeError(f"Failed to delete API key from Vault: {e}") from e

    def health_check(self) -> bool:
        try:
            return self.client.is_authenticated()
        except VaultError:
            return False

    def _load_vault_credentials(self) -> tuple[str | None, str | None]:
        vault_creds_path = Path(".vault-credentials")

        if not vault_creds_path.exists():
            return None, None

        role_id = None
        secret_id = None

        try:
            with open(vault_creds_path) as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("VAULT_ROLE_ID="):
                        role_id = line.split("=", 1)[1].strip()
                    elif line.startswith("VAULT_SECRET_ID="):
                        secret_id = line.split("=", 1)[1].strip()
        except Exception:
            pass

        return role_id, secret_id
