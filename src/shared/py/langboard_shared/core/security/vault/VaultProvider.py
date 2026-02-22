from abc import ABC, abstractmethod


class VaultProvider(ABC):
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    def create_key(self, key_id: str) -> str:
        pass

    @abstractmethod
    def get_key(self, key_id: str) -> str:
        pass

    @abstractmethod
    def delete_key(self, key_id: str):
        pass

    @abstractmethod
    def health_check(self) -> bool:
        pass
