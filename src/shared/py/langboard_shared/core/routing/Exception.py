from typing import Literal
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, ValidationError


def MissingException(
    loc: Literal["body", "query", "path", "header"], field: str, inputs: dict | None = None
) -> ValidationError:
    inputs = inputs or {}
    return ValidationError.from_exception_data(
        "Field required", [{"type": "missing", "loc": (loc, field), "input": inputs}]
    )


class ValidationFailureInfo(BaseModel):
    loc: Literal["body", "query", "path", "header"]
    field: str
    inputs: dict = {}


def ValidationFailureException(*errors: ValidationFailureInfo) -> RequestValidationError:
    return RequestValidationError(
        errors=[
            {
                "type": "value_error",
                "loc": (error.loc, error.field),
                "input": error.inputs,
                "ctx": {"error": ValueError("Invalid value")},
            }
            for error in errors
        ],
    )
