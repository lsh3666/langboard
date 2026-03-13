from ...Env import Env
from ..utils.decorators.ClassInstance import class_instance
from .vault import AwsKmsVaultProvider, AzureVaultProvider, HashiCorpVaultProvider, OpenBaoVaultProvider, VaultProvider


@class_instance()
class KeyVault(VaultProvider):
    def __init__(self):
        provider_type = Env.KEY_PROVIDER_TYPE

        if Env.IS_CLI:
            return

        if provider_type.startswith("openbao"):
            self.provider = OpenBaoVaultProvider()
        elif provider_type == "hashicorp":
            self.provider = HashiCorpVaultProvider()
        elif provider_type == "aws":
            self.provider = AwsKmsVaultProvider()
        elif provider_type == "azure":
            self.provider = AzureVaultProvider()
        else:
            raise ValueError(f"Unsupported key provider type: {provider_type}")

    def name(self) -> str:
        return self.provider.name()

    def create_key(self, key_id: str) -> str:
        return self.provider.create_key(key_id)

    def get_key(self, key_id: str) -> str:
        return self.provider.get_key(key_id)

    def delete_key(self, key_id: str):
        return self.provider.delete_key(key_id)

    def health_check(self) -> bool:
        return self.provider.health_check()
