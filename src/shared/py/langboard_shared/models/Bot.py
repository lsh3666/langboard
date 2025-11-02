from typing import Any, ClassVar
from sqlalchemy import TEXT
from ..core.db import ApiField, CSVType, Field, ModelColumnType
from ..core.storage import FileModel
from .BaseBotModel import BaseBotModel


ALLOWED_ALL_IPS = "*"


class Bot(BaseBotModel, table=True):
    BOT_TYPE: ClassVar[str] = "bot"
    BOT_UNAME_PREFIX: ClassVar[str] = "bot-"
    name: str = Field(nullable=False, api_field=ApiField())
    bot_uname: str = Field(nullable=False, api_field=ApiField())
    avatar: FileModel | None = Field(
        default=None, sa_type=ModelColumnType(FileModel), api_field=ApiField(field_base_model="path")
    )
    api_url: str = Field(default="", nullable=False, api_field=ApiField(by_conditions={"is_setting": ("both", True)}))
    api_key: str = Field(default="", nullable=False, api_field=ApiField(by_conditions={"is_setting": ("both", True)}))
    app_api_token: str = Field(
        nullable=False, api_field=ApiField(converter="hide_app_api_token", by_conditions={"is_setting": ("both", True)})
    )
    ip_whitelist: list[str] = Field(
        default=[], sa_type=CSVType, api_field=ApiField(by_conditions={"is_setting": ("both", True)})
    )
    value: str = Field(default="", sa_type=TEXT, api_field=ApiField(by_conditions={"is_setting": ("both", True)}))

    def get_fullname(self) -> str:
        return f"{self.name}"

    def hide_app_api_token(self) -> str:
        hide_rest_value = "*" * (len(self.app_api_token) - 8)
        return f"{self.app_api_token[:8]}{hide_rest_value}"

    def create_unknown_bot_api_response(self) -> dict[str, Any]:
        return {
            "uid": self.get_uid(),
            "name": self.name,
            "bot_uname": self.bot_uname,
            "avatar": None,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["name"]

    def __setattr__(self, name: str, value: Any) -> None:
        if name == "bot_uname" and isinstance(value, str):
            value = value if value.startswith(self.BOT_UNAME_PREFIX) else f"{self.BOT_UNAME_PREFIX}{value}"
        super().__setattr__(name, value)
