from enum import Enum
from json import dumps as json_dumps
from json import loads as json_loads
from typing import Any
from core.db import ApiField, BaseSqlModel, DateTimeField, EnumLikeType, Field
from core.types import SafeDateTime
from core.utils.Converter import json_default
from sqlalchemy import TEXT


class AppSettingType(Enum):
    ApiKey = "api_key"
    WebhookUrl = "webhook_url"


class AppSetting(BaseSqlModel, table=True):
    setting_type: AppSettingType = Field(nullable=False, sa_type=EnumLikeType(AppSettingType), api_field=ApiField())
    setting_name: str = Field(nullable=False, api_field=ApiField())
    setting_value: str = Field(default="", sa_type=TEXT, api_field=ApiField(converter="convert_setting_value"))
    last_used_at: SafeDateTime | None = DateTimeField(default=None, nullable=True, api_field=ApiField())
    total_used_count: int = Field(default=0, nullable=False, api_field=ApiField())

    def notification_data(self) -> dict[str, Any]:
        return {}

    def is_immutable_type(self) -> bool:
        return self.setting_type in [AppSettingType.ApiKey]

    def is_secret_type(self) -> bool:
        return self.setting_type in [AppSettingType.ApiKey]

    def convert_setting_value(self) -> Any:
        value = self.get_value()
        if self.is_secret_type():
            if self.setting_type == AppSettingType.ApiKey:
                hide_rest_value = "*" * (len(value) - 8)
                return f"{value[:8]}{hide_rest_value}"
        return value

    def get_value(self) -> Any:
        return json_loads(self.setting_value)

    def set_value(self, value: Any):
        self.setting_value = json_dumps(value, default=json_default)

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return []
