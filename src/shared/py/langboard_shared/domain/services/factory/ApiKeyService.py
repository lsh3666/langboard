from datetime import timedelta
from typing import Any, Literal, Sequence, overload
from uuid import uuid4
from ....core.domain import BaseDomainService
from ....core.domain.BaseDomainService import TMutableValidatorMap
from ....core.security import KeyVault
from ....core.types import SafeDateTime
from ....core.types.ParamTypes import TApiKeyParam
from ....core.utils.IpAddress import ALLOWED_ALL_IPS, is_valid_ipv4_address_or_range, make_valid_ipv4_range
from ....domain.models import ApiKeySetting, ApiKeyUsage, User
from ....domain.models.ApiKeySetting import ApiKeyProvider
from ....helpers import InfraHelper


class ApiKeyService(BaseDomainService):
    @staticmethod
    def name() -> str:
        """DO NOT EDIT THIS METHOD"""
        return "api_key"

    def get_by_id_like(self, api_key: TApiKeyParam | None) -> ApiKeySetting | None:
        api_key = InfraHelper.get_by_id_like(ApiKeySetting, api_key)
        return api_key

    @overload
    def get_api_list_in_settings(self, refer_time: SafeDateTime, only_count: Literal[True]) -> int: ...

    @overload
    def get_api_list_in_settings(
        self, refer_time: SafeDateTime, only_count: Literal[False]
    ) -> tuple[list[ApiKeySetting], int]: ...

    def get_api_list_in_settings(self, refer_time: SafeDateTime, only_count: bool = False):
        """Get API keys for settings page with pagination support"""
        count = self.repo.api_key.count_api_keys_scroller(refer_time)
        if only_count:
            return count

        api_keys = self.repo.api_key.get_api_keys_scroller(refer_time)
        return api_keys, count

    def get_api_list(self) -> list[dict[str, Any]]:
        """Get all API keys as API response"""
        api_keys = self.repo.api_key.get_all()
        return [api_key.api_response() for api_key in api_keys]

    def get_all_active(self) -> list[ApiKeySetting]:
        """Get all active API keys"""
        return self.repo.api_key.get_all_active()

    def get_all_by_user(self, user_id: int) -> list[ApiKeySetting]:
        """Get API keys by user"""
        return self.repo.api_key.get_all_by_user(user_id)

    def create(
        self,
        user: User,
        name: str,
        ip_whitelist: list[str] | None = None,
        is_active: bool = True,
        expires_in_days: str | None = None,
    ) -> tuple[ApiKeySetting, str] | None:
        provider_type = KeyVault.name()
        if provider_type == "openbao":
            provider = ApiKeyProvider.OpenBao
        elif provider_type == "hashicorp":
            provider = ApiKeyProvider.Hashicorp
        elif provider_type == "aws":
            provider = ApiKeyProvider.Aws
        elif provider_type == "azure":
            provider = ApiKeyProvider.Azure

        key_id = str(uuid4())

        key_material = KeyVault.create_key(key_id)

        # Set expiration
        expires_at = None
        expires_in_days_int = None
        if expires_in_days is not None and expires_in_days != "never":
            expires_in_days_int = int(expires_in_days)
            expires_at = SafeDateTime.now() + timedelta(days=expires_in_days_int)

        api_key_setting = ApiKeySetting(
            user_id=user.id,
            name=name,
            provider=provider,
            value=key_id,
            ip_whitelist=ip_whitelist or [],
            activated_at=SafeDateTime.now() if is_active else None,
            expires_in_days=expires_in_days_int,
            expires_at=expires_at,
        )
        self.repo.api_key.insert(api_key_setting)

        return api_key_setting, f"sk-{key_material}"

    def update(self, api_key: TApiKeyParam | None, form: dict) -> dict[str, Any] | Literal[True] | None:
        """Update API key"""
        api_key = InfraHelper.get_by_id_like(ApiKeySetting, api_key)
        if not api_key:
            return None

        if api_key.is_expired():
            return None

        validators: TMutableValidatorMap = {
            "name": "not_empty",
            "provider": "default",
        }

        old_record = self.apply_mutates(api_key, form, validators)
        if not old_record:
            return True

        self.repo.api_key.update(api_key)

        model = {}
        for key in form:
            if key not in validators or key not in old_record:
                continue
            model[key] = getattr(api_key, key)

        return model

    def delete(self, api_key: TApiKeyParam | None) -> bool:
        """Delete API key"""
        api_key = InfraHelper.get_by_id_like(ApiKeySetting, api_key)
        if not api_key:
            return False

        try:
            KeyVault.delete_key(api_key.value)
        except Exception:
            pass

        self.repo.api_key.delete(api_key)
        return True

    def activate(self, api_key: TApiKeyParam | None) -> bool:
        """Activate API key"""
        api_key_obj = InfraHelper.get_by_id_like(ApiKeySetting, api_key)
        if not api_key_obj:
            return False

        if api_key_obj.expires_at and api_key_obj.expires_at < SafeDateTime.now():
            return False

        api_key_obj.activated_at = SafeDateTime.now()
        self.repo.api_key.update(api_key_obj)
        return True

    def deactivate(self, api_key: TApiKeyParam | None) -> bool:
        """Deactivate API key"""
        api_key_obj = InfraHelper.get_by_id_like(ApiKeySetting, api_key)
        if not api_key_obj:
            return False

        if api_key_obj.is_expired():
            return False

        api_key_obj.activated_at = None
        self.repo.api_key.update(api_key_obj)
        return True

    def log_usage(
        self,
        api_key: ApiKeySetting,
        endpoint: str,
        method: str,
        ip_address: str | None = None,
        status_code: int = 200,
        is_success: bool = True,
    ) -> None:
        usage = ApiKeyUsage(
            api_key_id=api_key.id,
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            is_success=is_success,
            ip_address=ip_address,
        )
        self.repo.api_key_usage.insert(usage)

    def update_ip_whitelist(self, api_key: TApiKeyParam | None, ip_whitelist: list[str]) -> bool:
        api_key = InfraHelper.get_by_id_like(ApiKeySetting, api_key)
        if not api_key:
            return False

        if api_key.is_expired():
            return False

        valid_ip_whitelist = self.filter_valid_ip_whitelist(ip_whitelist)

        api_key.ip_whitelist = valid_ip_whitelist
        self.repo.api_key.update(api_key)

        return True

    def filter_valid_ip_whitelist(self, ip_whitelist: list[str]) -> list[str]:
        valid_ip_whitelist = []
        if ALLOWED_ALL_IPS in ip_whitelist:
            valid_ip_whitelist.append(ALLOWED_ALL_IPS)
        else:
            for ip in ip_whitelist:
                if not is_valid_ipv4_address_or_range(ip):
                    continue
                if ip.endswith("/24"):
                    ip = make_valid_ipv4_range(ip)
                valid_ip_whitelist.append(ip)
        return valid_ip_whitelist

    def delete_selected(self, api_keys: Sequence[TApiKeyParam]) -> None:
        if not isinstance(api_keys, Sequence) or isinstance(api_keys, str):
            api_keys = [api_keys]

        for api_key in api_keys:
            self.delete(api_key)
