from typing import Callable
from fastapi import Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.routing import APIRoute
from ..logger import Logger
from .ApiErrorCode import ApiErrorCode
from .JsonResponse import JsonResponse


class AppExceptionHandlingRoute(APIRoute):
    """Handles exceptions that occur during the route handling process inherited from :class:`fastapi.routing.APIRoute`."""

    def get_route_handler(self) -> Callable:
        original_route_handler = super().get_route_handler()

        async def route_handler(request: Request) -> Response:
            try:
                return await original_route_handler(request)
            except RequestValidationError as e:
                errors: dict[str, dict] = {}
                raw_errors = e.errors()
                for raw_error in raw_errors:
                    error_type = raw_error["type"]
                    if error_type not in errors:
                        errors[error_type] = {}
                    if len(raw_error["loc"]) <= 1:
                        continue

                    where = raw_error["loc"][0]
                    fields = raw_error["loc"][1:]
                    if where not in errors[error_type]:
                        errors[error_type][where] = []
                    errors[error_type][where].extend(fields)
                return JsonResponse(
                    content={**ApiErrorCode.VA0000.to_dict(), "errors": errors}, status_code=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                Logger.main.exception(e)

                return JsonResponse(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content={**ApiErrorCode.OP0000.to_dict(), "status": False},
                )

        return route_handler
