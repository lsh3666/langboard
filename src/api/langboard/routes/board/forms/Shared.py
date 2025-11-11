from langboard_shared.core.routing import BaseFormModel, form_model
from pydantic import Field


@form_model
class AssignUsersForm(BaseFormModel):
    assigned_users: list[str] = Field(..., title="List of user UIDs")


@form_model
class AssigneesForm(BaseFormModel):
    assignees: list[str] = Field(..., title="List of user and bot UIDs")


@form_model
class ChangeRootOrderForm(BaseFormModel):
    order: int = Field(..., title="New order")


@form_model
class ChangeChildOrderForm(BaseFormModel):
    order: int = Field(..., title="New order")
    parent_uid: str = Field(default="", title="If moving to another parent, the UID of the parent")
