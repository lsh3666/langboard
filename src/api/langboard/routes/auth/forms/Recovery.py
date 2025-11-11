from langboard_shared.core.routing import BaseFormModel, form_model


@form_model
class SendResetLinkForm(BaseFormModel):
    sign_token: str
    email_token: str
    firstname: str = ""
    lastname: str = ""
    is_resend: bool = False


@form_model
class ValidateTokenForm(BaseFormModel):
    recovery_token: str


@form_model
class ResetPasswordForm(BaseFormModel):
    recovery_token: str
    password: str
