import { EHttpStatus } from "@langboard/core/enums";

const errorMessages: Record<number, string> = {
    [EHttpStatus.HTTP_400_BAD_REQUEST]: "Bad Request",
    [EHttpStatus.HTTP_401_UNAUTHORIZED]: "Unauthorized",
    [EHttpStatus.HTTP_402_PAYMENT_REQUIRED]: "Payment Required",
    [EHttpStatus.HTTP_403_FORBIDDEN]: "Forbidden",
    [EHttpStatus.HTTP_404_NOT_FOUND]: "Not Found",
    [EHttpStatus.HTTP_405_METHOD_NOT_ALLOWED]: "Method Not Allowed",
    [EHttpStatus.HTTP_406_NOT_ACCEPTABLE]: "Not Acceptable",
    [EHttpStatus.HTTP_407_PROXY_AUTHENTICATION_REQUIRED]: "Proxy Authentication Required",
    [EHttpStatus.HTTP_408_REQUEST_TIMEOUT]: "Request Timeout",
    [EHttpStatus.HTTP_409_CONFLICT]: "Conflict",
    [EHttpStatus.HTTP_410_GONE]: "Gone",
    [EHttpStatus.HTTP_411_LENGTH_REQUIRED]: "Length Required",
    [EHttpStatus.HTTP_412_PRECONDITION_FAILED]: "Precondition Failed",
    [EHttpStatus.HTTP_413_REQUEST_ENTITY_TOO_LARGE]: "Request Entity Too Large",
    [EHttpStatus.HTTP_414_REQUEST_URI_TOO_LONG]: "Request URI Too Long",
    [EHttpStatus.HTTP_415_UNSUPPORTED_MEDIA_TYPE]: "Unsupported Media Type",
    [EHttpStatus.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE]: "Requested Range Not Satisfiable",
    [EHttpStatus.HTTP_417_EXPECTATION_FAILED]: "Expectation Failed",
    [EHttpStatus.HTTP_418_IM_A_TEAPOT]: "I'm A Teapot",
    [EHttpStatus.HTTP_421_MISDIRECTED_REQUEST]: "Misdirected Request",
    [EHttpStatus.HTTP_422_UNPROCESSABLE_CONTENT]: "Unprocessable Entity",
    [EHttpStatus.HTTP_423_LOCKED]: "Locked",
    [EHttpStatus.HTTP_424_FAILED_DEPENDENCY]: "Failed Dependency",
    [EHttpStatus.HTTP_425_TOO_EARLY]: "Too Early",
    [EHttpStatus.HTTP_426_UPGRADE_REQUIRED]: "Upgrade Required",
    [EHttpStatus.HTTP_428_PRECONDITION_REQUIRED]: "Precondition Required",
    [EHttpStatus.HTTP_429_TOO_MANY_REQUESTS]: "Too many Requests",
    [EHttpStatus.HTTP_431_REQUEST_HEADER_FIELDS_TOO_LARGE]: "Request Header Fields Too Large",
    [EHttpStatus.HTTP_451_UNAVAILABLE_FOR_LEGAL_REASONS]: "Unavailable For Legal Reasons",
};

const getErrorMessage = (errorCode: EHttpStatus): string => {
    return errorMessages[errorCode] || errorMessages[EHttpStatus.HTTP_404_NOT_FOUND];
};

export default getErrorMessage;
