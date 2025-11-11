from langboard_shared.core.routing import BaseFormModel, form_model
from pydantic import BaseModel, Field


class MetadataGetModel(BaseModel):
    key: str = Field(..., title="The key of the metadata")


@form_model
class MetadataForm(BaseFormModel):
    key: str = Field(..., title="The key of the metadata")
    value: str = Field(..., title="The value of the metadata")
    old_key: str | None = Field(
        default=None, title="The old key of the metadata (Required if you are updating existing key to a new key)"
    )


@form_model
class MetadataDeleteForm(BaseFormModel):
    keys: list[str] = Field(..., title="The keys of the metadata to be deleted")
