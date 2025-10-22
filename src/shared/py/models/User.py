from typing import Any, ClassVar
from bcrypt import checkpw, gensalt, hashpw
from core.db import ApiField, Field
from core.db.ColumnTypes import DateTimeField, ModelColumnType, SecretStr, SecretStrType
from core.db.Models import SoftDeleteModel
from core.storage import FileModel
from core.types import SafeDateTime, SnowflakeID
from core.utils.String import generate_random_string


class User(SoftDeleteModel, table=True):
    USER_TYPE: ClassVar[str] = "user"
    UNKNOWN_USER_TYPE: ClassVar[str] = "unknown"
    GROUP_EMAIL_TYPE: ClassVar[str] = "group_email"
    firstname: str = Field(nullable=False, api_field=ApiField())
    lastname: str = Field(nullable=False, api_field=ApiField())
    email: str = Field(nullable=False, api_field=ApiField())
    username: str = Field(
        default_factory=lambda: f"user-{generate_random_string(8)}", unique=True, nullable=False, api_field=ApiField()
    )
    password: SecretStr = Field(nullable=False, sa_type=SecretStrType)
    is_admin: bool = Field(default=False)
    avatar: FileModel | None = Field(default=None, sa_type=ModelColumnType(FileModel))
    preferred_lang: str = Field(default="en-US", nullable=False)
    activated_at: SafeDateTime | None = DateTimeField(default=None, nullable=True)

    @classmethod
    def api_schema(cls, schema: dict | None = None) -> dict[str, Any]:
        return super().api_schema(
            {
                "type": f"Literal[{User.USER_TYPE}, {User.UNKNOWN_USER_TYPE}, {User.GROUP_EMAIL_TYPE}]",
                **(schema or {}),
            }
        )

    def check_password(self, password: str) -> bool:
        return checkpw(password.encode(), self.password.get_secret_value().encode())

    def set_password(self, password: str) -> None:
        self.password = self.__create_password(password)

    def get_fullname(self) -> str:
        return f"{self.firstname} {self.lastname}"

    def api_response(self) -> dict[str, Any]:
        if self.deleted_at is not None:
            return User.create_unknown_user_api_response(self.get_uid())

        return {
            **super().api_response(),
            "type": User.USER_TYPE,
        }

    def notification_data(self) -> dict[str, Any]:
        return self.api_response()

    @staticmethod
    def create_unknown_user_api_response(uid: str) -> dict[str, Any]:
        return {
            "type": User.UNKNOWN_USER_TYPE,
            "uid": uid,
            "firstname": "",
            "lastname": "",
            "email": "",
            "username": "",
            "avatar": None,
        }

    @staticmethod
    def create_email_user_api_response(user_id: SnowflakeID, email: str) -> dict[str, Any]:
        return {
            "type": User.GROUP_EMAIL_TYPE,
            "uid": user_id.to_short_code(),
            "firstname": email,
            "lastname": "",
            "email": email,
            "username": "",
            "avatar": None,
        }

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["firstname", "lastname", "email", "username", "is_admin", "preferred_lang", "activated_at"]

    def __setattr__(self, name: str, value: Any) -> None:
        if name == "password" and not isinstance(value, SecretStr):
            value = self.__create_password(value)
        super().__setattr__(name, value)

    def __create_password(self, password: str) -> SecretStr:
        return SecretStr(hashpw(password.encode(), gensalt()).decode())
