from abc import ABC, abstractmethod
from fastapi import HTTPException, status
from .ApiErrorCode import ApiErrorCode


class ApiErrorCodeException(ABC, HTTPException):
    def __init__(self, error_code: ApiErrorCode):
        super().__init__(status_code=self.code(), detail=error_code.to_dict())

    @classmethod
    @abstractmethod
    def code(cls) -> int: ...


class BadRequestException(ApiErrorCodeException):
    """400 Bad Request"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_400_BAD_REQUEST


class UnauthorizedException(ApiErrorCodeException):
    """401 Unauthorized"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_401_UNAUTHORIZED


class PaymentRequiredException(ApiErrorCodeException):
    """402 Payment Required"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_402_PAYMENT_REQUIRED


class ForbiddenException(ApiErrorCodeException):
    """403 Forbidden"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_403_FORBIDDEN


class NotFoundException(ApiErrorCodeException):
    """404 Not Found"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_404_NOT_FOUND


class MethodNotAllowedException(ApiErrorCodeException):
    """405 Method Not Allowed"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_405_METHOD_NOT_ALLOWED


class NotAcceptableException(ApiErrorCodeException):
    """406 Not Acceptable"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_406_NOT_ACCEPTABLE


class ProxyAuthenticationRequiredException(ApiErrorCodeException):
    """407 Proxy Authentication Required"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_407_PROXY_AUTHENTICATION_REQUIRED


class RequestTimeoutException(ApiErrorCodeException):
    """408 Request Timeout"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_408_REQUEST_TIMEOUT


class ConflictException(ApiErrorCodeException):
    """409 Conflict"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_409_CONFLICT


class GoneException(ApiErrorCodeException):
    """410 Gone"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_410_GONE


class LengthRequiredException(ApiErrorCodeException):
    """411 Length Required"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_411_LENGTH_REQUIRED


class PreconditionFailedException(ApiErrorCodeException):
    """412 Precondition Failed"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_412_PRECONDITION_FAILED


class ContentTooLargeException(ApiErrorCodeException):
    """413 Content Too Large"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_413_CONTENT_TOO_LARGE


class UriTooLongException(ApiErrorCodeException):
    """414 URI Too Long"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_414_URI_TOO_LONG


class UnsupportedMediaTypeException(ApiErrorCodeException):
    """415 Unsupported Media Type"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_415_UNSUPPORTED_MEDIA_TYPE


class RangeNotSatisfiableException(ApiErrorCodeException):
    """416 Range Not Satisfiable"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_416_RANGE_NOT_SATISFIABLE


class ExpectationFailedException(ApiErrorCodeException):
    """417 Expectation Failed"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_417_EXPECTATION_FAILED


class ImATeapotException(ApiErrorCodeException):
    """418 I'm a teapot"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_418_IM_A_TEAPOT


class MisdirectedRequestException(ApiErrorCodeException):
    """421 Misdirected Request"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_421_MISDIRECTED_REQUEST


class UnprocessableContentException(ApiErrorCodeException):
    """422 Unprocessable Content"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_422_UNPROCESSABLE_CONTENT


class LockedException(ApiErrorCodeException):
    """423 Locked"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_423_LOCKED


class FailedDependencyException(ApiErrorCodeException):
    """424 Failed Dependency"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_424_FAILED_DEPENDENCY


class TooEarlyException(ApiErrorCodeException):
    """425 Too Early"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_425_TOO_EARLY


class UpgradeRequiredException(ApiErrorCodeException):
    """426 Upgrade Required"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_426_UPGRADE_REQUIRED


class PreconditionRequiredException(ApiErrorCodeException):
    """428 Precondition Required"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_428_PRECONDITION_REQUIRED


class TooManyRequestsException(ApiErrorCodeException):
    """429 Too Many Requests"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_429_TOO_MANY_REQUESTS


class RequestHeaderFieldsTooLargeException(ApiErrorCodeException):
    """431 Request Header Fields Too Large"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_431_REQUEST_HEADER_FIELDS_TOO_LARGE


class UnavailableForLegalReasonsException(ApiErrorCodeException):
    """451 Unavailable For Legal Reasons"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_451_UNAVAILABLE_FOR_LEGAL_REASONS


class InternalServerErrorException(ApiErrorCodeException):
    """500 Internal Server Error"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_500_INTERNAL_SERVER_ERROR


class NotImplementedException(ApiErrorCodeException):
    """501 Not Implemented"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_501_NOT_IMPLEMENTED


class BadGatewayException(ApiErrorCodeException):
    """502 Bad Gateway"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_502_BAD_GATEWAY


class ServiceUnavailableException(ApiErrorCodeException):
    """503 Service Unavailable"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_503_SERVICE_UNAVAILABLE


class GatewayTimeoutException(ApiErrorCodeException):
    """504 Gateway Timeout"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_504_GATEWAY_TIMEOUT


class HttpVersionNotSupportedException(ApiErrorCodeException):
    """505 HTTP Version Not Supported"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_505_HTTP_VERSION_NOT_SUPPORTED


class VariantAlsoNegotiatesException(ApiErrorCodeException):
    """506 Variant Also Negotiates"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_506_VARIANT_ALSO_NEGOTIATES


class InsufficientStorageException(ApiErrorCodeException):
    """507 Insufficient Storage"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_507_INSUFFICIENT_STORAGE


class LoopDetectedException(ApiErrorCodeException):
    """508 Loop Detected"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_508_LOOP_DETECTED


class NotExtendedException(ApiErrorCodeException):
    """510 Not Extended"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_510_NOT_EXTENDED


class NetworkAuthenticationRequiredException(ApiErrorCodeException):
    """511 Network Authentication Required"""

    @classmethod
    def code(cls) -> int:
        return status.HTTP_511_NETWORK_AUTHENTICATION_REQUIRED


class ApiException:
    BadRequest_400 = BadRequestException
    Unauthorized_401 = UnauthorizedException
    PaymentRequired_402 = PaymentRequiredException
    Forbidden_403 = ForbiddenException
    NotFound_404 = NotFoundException
    MethodNotAllowed_405 = MethodNotAllowedException
    NotAcceptable_406 = NotAcceptableException
    ProxyAuthenticationRequired_407 = ProxyAuthenticationRequiredException
    RequestTimeout_408 = RequestTimeoutException
    Conflict_409 = ConflictException
    Gone_410 = GoneException
    LengthRequired_411 = LengthRequiredException
    PreconditionFailed_412 = PreconditionFailedException
    ContentTooLarge_413 = ContentTooLargeException
    UriTooLong_414 = UriTooLongException
    UnsupportedMediaType_415 = UnsupportedMediaTypeException
    RangeNotSatisfiable_416 = RangeNotSatisfiableException
    ExpectationFailed_417 = ExpectationFailedException
    ImATeapot_418 = ImATeapotException
    MisdirectedRequest_421 = MisdirectedRequestException
    UnprocessableContent_422 = UnprocessableContentException
    Locked_423 = LockedException
    FailedDependency_424 = FailedDependencyException
    TooEarly_425 = TooEarlyException
    UpgradeRequired_426 = UpgradeRequiredException
    PreconditionRequired_428 = PreconditionRequiredException
    TooManyRequests_429 = TooManyRequestsException
    RequestHeaderFieldsTooLarge_431 = RequestHeaderFieldsTooLargeException
    UnavailableForLegalReasons_451 = UnavailableForLegalReasonsException
    InternalServerError_500 = InternalServerErrorException
    NotImplemented_501 = NotImplementedException
    BadGateway_502 = BadGatewayException
    ServiceUnavailable_503 = ServiceUnavailableException
    GatewayTimeout_504 = GatewayTimeoutException
    HttpVersionNotSupported_505 = HttpVersionNotSupportedException
    VariantAlsoNegotiates_506 = VariantAlsoNegotiatesException
    InsufficientStorage_507 = InsufficientStorageException
    LoopDetected_508 = LoopDetectedException
    NotExtended_510 = NotExtendedException
    NetworkAuthenticationRequired_511 = NetworkAuthenticationRequiredException
