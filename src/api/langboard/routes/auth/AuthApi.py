from fastapi import Request, status
from jwt import ExpiredSignatureError
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, ApiException, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.core.security import AuthSecurity
from langboard_shared.core.utils.Encryptor import Encryptor
from langboard_shared.domain.models import Bot, User, UserEmail, UserGroup, UserProfile
from langboard_shared.domain.models.UserNotification import NotificationType
from langboard_shared.domain.models.UserNotificationUnsubscription import NotificationChannel, NotificationScope
from langboard_shared.domain.services import DomainService
from langboard_shared.Env import Env
from langboard_shared.security import Auth
from typing_extensions import Annotated
from .forms import AuthEmailForm, AuthEmailResponse, SignInForm


@AppRouter.api.post(
    "/auth/email",
    response_model=AuthEmailResponse,
    tags=["Auth"],
    responses=(
        OpenApiSchema().suc(AuthEmailResponse).err(406, ApiErrorCode.AU1002).err(404, ApiErrorCode.NF1004).get()
    ),
)
async def auth_email(
    form: AuthEmailForm, service: Annotated[DomainService, DomainService.scope()]
) -> JsonResponse | AuthEmailResponse:
    if form.is_token:
        user, subemail = await service.user.get_by_token(form.token, form.sign_token)
    else:
        user, subemail = await service.user.get_by_email(form.email)

    if subemail and not subemail.verified_at:
        raise ApiException.NotAcceptable_406(ApiErrorCode.AU1002)

    if not user:
        raise ApiException.NotFound_404(ApiErrorCode.NF1004)

    token = Encryptor.encrypt(user.email, form.sign_token)
    return AuthEmailResponse(token=token, email=user.email)


@AppRouter.api.post(
    "/auth/signin",
    tags=["Auth"],
    responses=(
        OpenApiSchema()
        .suc({"access_token": "string"})
        .err(404, ApiErrorCode.VA1001, ApiErrorCode.VA1002)
        .err(406, ApiErrorCode.AU1002)
        .err(423, ApiErrorCode.AU1003)
        .get()
    ),
)
async def sign_in(form: SignInForm, service: DomainService = DomainService.scope()) -> JsonResponse:
    user, subemail = await service.user.get_by_token(form.email_token, form.sign_token)

    if not user:
        raise ApiException.NotFound_404(ApiErrorCode.VA1001)

    if subemail and not subemail.verified_at:
        raise ApiException.NotAcceptable_406(ApiErrorCode.AU1002)

    if not user.check_password(form.password):
        raise ApiException.NotFound_404(ApiErrorCode.VA1002)

    if not user.activated_at:
        raise ApiException.Locked_423(ApiErrorCode.AU1003)

    access_token, refresh_token = AuthSecurity.authenticate(user.id)

    response = JsonResponse(content={"access_token": access_token})
    response.set_cookie(
        Env.REFRESH_TOKEN_NAME,
        refresh_token,
        max_age=Env.JWT_RT_EXPIRATION * 60 * 60 * 24,
        domain=Env.DOMAIN if Env.DOMAIN else None,
        httponly=True,
        secure=Env.PUBLIC_UI_URL.startswith("https://"),
    )

    return response


@AppRouter.api.post(
    "/auth/refresh",
    tags=["Auth"],
    responses=(
        OpenApiSchema()
        .suc({"access_token": "string"})
        .err(422, ApiErrorCode.AU1004)
        .err(401, ApiErrorCode.AU1004)
        .get()
    ),
)
async def refresh(request: Request) -> JsonResponse:
    try:
        refresh_token = request.cookies.get(Env.REFRESH_TOKEN_NAME, None)
        if not refresh_token:
            raise Exception()

        new_access_token = AuthSecurity.refresh(refresh_token)
        user = await Auth.get_user_by_token(new_access_token)

        if not user:
            raise Exception()
    except ExpiredSignatureError:
        return JsonResponse(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT)
    except Exception:
        return JsonResponse(status_code=status.HTTP_401_UNAUTHORIZED)

    return JsonResponse(content={"access_token": new_access_token})


@AppRouter.api.get(
    "/auth/me",
    tags=["Auth"],
    responses=(
        OpenApiSchema()
        .suc(
            {
                "user": (
                    (User, UserProfile),
                    {
                        "schema": {
                            "preferred_lang": "string",
                            "user_groups": [UserGroup],
                            "subemails": [UserEmail],
                            "is_admin?": "bool",
                            "notification_unsubs": {
                                NotificationScope.All.value: {
                                    NotificationType: {
                                        NotificationChannel: "bool",
                                    }
                                },
                                NotificationScope.Specific.value: {
                                    NotificationType: {
                                        NotificationChannel: ["<specific uid>"],
                                    }
                                },
                            },
                        }
                    },
                ),
                "bots": [Bot],
            }
        )
        .auth()
        .forbidden()
        .get()
    ),
)
@AuthFilter.add("user")
async def about_me(user: User = Auth.scope("user"), service: DomainService = DomainService.scope()) -> JsonResponse:
    profile = await service.user.get_api_profile(user)
    response = {
        **user.api_response(),
        **profile,
        "preferred_lang": user.preferred_lang,
    }
    response["user_groups"] = await service.user_group.get_api_list_by_user(user)
    response["subemails"] = await service.user.get_subemails(user)
    response["notification_unsubs"] = await service.user_notification_setting.get_api_map_by_user(user)

    if user.is_admin:
        response["is_admin"] = True

    bots = await service.bot.get_api_list()

    return JsonResponse(content={"user": response, "bots": bots})


@AppRouter.api.post("/auth/signout", tags=["Auth"], responses=OpenApiSchema(202).get())
async def sign_out():
    is_secure = Env.PUBLIC_UI_URL.startswith("https://")
    response = JsonResponse(status_code=status.HTTP_202_ACCEPTED)
    response.delete_cookie(Env.REFRESH_TOKEN_NAME, httponly=True, secure=is_secure)

    return response
