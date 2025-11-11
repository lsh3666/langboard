from langboard_shared.core.routing import BaseFormModel, form_model


@form_model
class CreateChatTemplate(BaseFormModel):
    name: str
    template: str


@form_model
class UpdateChatTemplate(BaseFormModel):
    name: str | None = None
    template: str | None = None
