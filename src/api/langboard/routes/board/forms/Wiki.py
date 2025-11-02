from langboard_shared.core.db import EditorContentModel
from langboard_shared.core.routing import BaseFormModel, form_model
from pydantic import Field


@form_model
class WikiForm(BaseFormModel):
    title: str = Field(..., description="Wiki title")
    content: EditorContentModel | None = Field(None, description="Wiki content")


@form_model
class ChangeWikiDetailsForm(BaseFormModel):
    title: str | None = Field(None, description="Wiki title")
    content: EditorContentModel | None = Field(None, description="Wiki content")


@form_model
class ChangeWikiPublicForm(BaseFormModel):
    is_public: bool = Field(..., description="Wiki public status")
