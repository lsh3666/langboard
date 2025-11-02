from langboard_shared.core.routing import BaseFormModel, form_model


@form_model
class NotificationForm(BaseFormModel):
    time_range: str  # "3d", "7d", "1m", "all"
