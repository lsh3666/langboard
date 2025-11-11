from langboard_shared.core.routing import BaseFormModel, form_model
from pydantic import Field


@form_model
class ColumnForm(BaseFormModel):
    name: str = Field(..., description="Project column name")
