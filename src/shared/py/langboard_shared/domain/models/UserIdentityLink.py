from enum import Enum
from typing import Any
from sqlalchemy import UniqueConstraint
from ...core.db import ApiField, BaseSqlModel, EnumLikeType, Field, SnowflakeIDField
from ...core.types import SnowflakeID
from .User import User


class IdentityProvider(Enum):
    Oidc = "oidc"
    Scim = "scim"


class UserIdentityLink(BaseSqlModel, table=True):
    __table_args__ = (
        UniqueConstraint("provider", "external_id", name="uq_user_identity_link_provider_external_id"),
        UniqueConstraint("user_id", "provider", name="uq_user_identity_link_user_provider"),
    )

    user_id: SnowflakeID = SnowflakeIDField(
        foreign_key=User, nullable=False, index=True, api_field=ApiField(name="user_uid")
    )
    provider: IdentityProvider = Field(
        nullable=False, sa_type=EnumLikeType(IdentityProvider), index=True, api_field=ApiField()
    )
    external_id: str = Field(nullable=False, index=True, api_field=ApiField())
    issuer: str | None = Field(default=None, nullable=True, api_field=ApiField())
    email: str | None = Field(default=None, nullable=True, api_field=ApiField())

    def notification_data(self) -> dict[str, Any]:
        return {}

    def _get_repr_keys(self) -> list[str | tuple[str, str]]:
        return ["user_id", "provider", "external_id", "issuer", "email"]
