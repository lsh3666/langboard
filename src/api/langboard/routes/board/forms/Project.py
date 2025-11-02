from langboard_shared.core.routing import BaseFormModel, form_model
from langboard_shared.core.schema import Pagination
from langboard_shared.core.types import SafeDateTime
from langboard_shared.models.InternalBot import InternalBotType
from langboard_shared.models.ProjectRole import ProjectRoleAction
from pydantic import Field


@form_model
class InviteProjectMemberForm(BaseFormModel):
    emails: list[str]


@form_model
class ProjectInvitationForm(BaseFormModel):
    invitation_token: str


class ChatHistoryPagination(Pagination):
    refer_time: SafeDateTime = SafeDateTime.now()


@form_model
class UpdateProjectDetailsForm(BaseFormModel):
    title: str = Field(..., description="Project title")
    description: str | None = Field(None, description="Project description")
    project_type: str = Field("Other", description="Project type")


@form_model
class UpdateRolesForm(BaseFormModel):
    roles: list[ProjectRoleAction]


@form_model
class ChangeInternalBotForm(BaseFormModel):
    internal_bot_uid: str


@form_model
class ChangeInternalBotSettingsForm(BaseFormModel):
    bot_type: InternalBotType
    use_default_prompt: bool | None = None
    prompt: str | None = None


@form_model
class UpdateProjectChatSessionForm(BaseFormModel):
    title: str
