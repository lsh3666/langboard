from re import match
from typing import Any
from langboard_shared.ai import BaseSharedBotForm
from langboard_shared.core.routing import BaseFormModel, form_model
from langboard_shared.core.routing.Exception import InvalidError, InvalidException, MissingException
from langboard_shared.core.types import SafeDateTime
from langboard_shared.models.AppSetting import AppSettingType
from langboard_shared.models.BaseBotModel import BotPlatform, BotPlatformRunningType
from langboard_shared.models.InternalBot import InternalBotType
from pydantic import BaseModel, field_validator
from ...Constants import EMAIL_REGEX


class UsersPagination(BaseModel):
    refer_time: SafeDateTime = SafeDateTime.now()
    only_count: bool = False


@form_model
class CreateSettingForm(BaseFormModel):
    setting_type: AppSettingType
    setting_name: str
    setting_value: Any = ""


@form_model
class UpdateSettingForm(BaseFormModel):
    setting_name: str | None = None
    setting_value: Any | None = None


@form_model
class DeleteSelectedSettingsForm(BaseFormModel):
    setting_uids: list[str]


@form_model
class CreateUserForm(BaseFormModel):
    firstname: str
    lastname: str
    email: str
    password: str
    industry: str
    purpose: str
    affiliation: str | None = None
    position: str | None = None
    is_admin: bool = False
    should_activate: bool = False

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if not value:
            raise MissingException("body", "email", {"email": value})

        if not bool(match(EMAIL_REGEX, value)):
            raise InvalidException(
                InvalidError(
                    loc="body",
                    field="email",
                    inputs={"email": value},
                )
            )

        return value


@form_model
class UpdateUserForm(BaseFormModel):
    firstname: str | None = None
    lastname: str | None = None
    password: str | None = None
    industry: str | None = None
    purpose: str | None = None
    affiliation: str | None = None
    position: str | None = None
    is_admin: bool | None = None
    activate: bool | None = None


@form_model
class DeleteSelectedUsersForm(BaseFormModel):
    user_uids: list[str]


@form_model
class CreateBotForm(BaseSharedBotForm):
    bot_name: str
    bot_uname: str
    ip_whitelist: str | None = None


@form_model
class UpdateBotForm(BaseFormModel):
    bot_name: str | None = None
    bot_uname: str | None = None
    platform: BotPlatform | None = None
    platform_running_type: BotPlatformRunningType | None = None
    api_url: str | None = None
    api_key: str | None = None
    ip_whitelist: str | None = None
    value: str | None = None
    delete_avatar: bool = False


@form_model
class CreateGlobalRelationshipTypeForm(BaseFormModel):
    parent_name: str
    child_name: str
    description: str = ""


@form_model
class ImportGlobalRelationshipTypesForm(BaseFormModel):
    relationships: list[CreateGlobalRelationshipTypeForm]


@form_model
class UpdateGlobalRelationshipTypeForm(BaseFormModel):
    parent_name: str | None = None
    child_name: str | None = None
    description: str | None = None


@form_model
class DeleteSelectedGlobalRelationshipTypesForm(BaseFormModel):
    relationship_type_uids: list[str]


@form_model
class CreateInternalBotForm(BaseSharedBotForm):
    bot_type: InternalBotType
    display_name: str


@form_model
class UpdateInternalBotForm(BaseFormModel):
    display_name: str | None = None
    platform: BotPlatform | None = None
    platform_running_type: BotPlatformRunningType | None = None
    api_url: str | None = None
    api_key: str | None = None
    value: str | None = None
    delete_avatar: bool = False


@form_model
class OllamaModelForm(BaseFormModel):
    model: str
