from langboard_shared.core.routing import BaseFormModel, form_model


@form_model
class UpdateProfileForm(BaseFormModel):
    firstname: str
    lastname: str
    affiliation: str | None = None
    position: str | None = None
    delete_avatar: bool = False


@form_model
class AddNewEmailForm(BaseFormModel):
    new_email: str
    is_resend: bool = False


@form_model
class VerifyNewEmailForm(BaseFormModel):
    verify_token: str


@form_model
class EmailForm(BaseFormModel):
    email: str


@form_model
class ChangePasswordForm(BaseFormModel):
    current_password: str
    new_password: str


@form_model
class CreateUserGroupForm(BaseFormModel):
    name: str


@form_model
class UpdateUserGroupAssignedEmailForm(BaseFormModel):
    emails: list[str]


@form_model
class UpdatePreferredLangForm(BaseFormModel):
    lang: str
