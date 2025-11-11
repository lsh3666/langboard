from re import match
from langboard_shared.core.routing import BaseFormModel, form_model
from langboard_shared.core.routing.Exception import InvalidError, InvalidException, MissingException
from pydantic import field_validator
from ....Constants import EMAIL_REGEX


@form_model
class CheckEmailForm(BaseFormModel):
    email: str


@form_model
class SignUpForm(BaseFormModel):
    firstname: str
    lastname: str
    email: str
    password: str
    industry: str
    purpose: str
    affiliation: str | None = None
    position: str | None = None

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
class ResendLinkForm(BaseFormModel):
    email: str


@form_model
class ActivateUserForm(BaseFormModel):
    signup_token: str
