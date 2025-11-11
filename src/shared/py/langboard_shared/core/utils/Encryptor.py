from base64 import b64decode, b64encode
from cryptocode import decrypt, encrypt
from .decorators import staticclass


@staticclass
class Encryptor:
    """Encrypts and decrypts data using a key."""

    @staticmethod
    def encrypt(data: str, key: str) -> str:
        encrypted = encrypt(data, key).encode()
        base64_encoded = b64encode(encrypted).decode()
        return base64_encoded

    @staticmethod
    def decrypt(data: str, key: str) -> str:
        base64_decoded = b64decode(data.encode()).decode()
        decrypted = decrypt(base64_decoded, key)
        if not decrypted:
            return ""
        return decrypted
