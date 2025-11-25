from fastapi import status
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.domain.models import Bot, InternalBot, User
from langboard_shared.domain.services import DomainService
from langboard_shared.security import Auth


@AppRouter.api.get("/health", tags=["Global"], responses=OpenApiSchema().suc({}, 200).get())
async def health_check() -> JsonResponse:
    return JsonResponse(content={"status": "ok"}, status_code=status.HTTP_200_OK)


@AppRouter.api.get(
    "/global/internal-bot/{bot_uid}",
    tags=["Global"],
    responses=OpenApiSchema().suc({"internal_bot": InternalBot.api_schema()}).auth().forbidden().get(),
)
@AuthFilter.add("user")
async def get_internal_bot(
    bot_uid: str, user: User = Auth.scope("user"), service: DomainService = DomainService.scope()
) -> JsonResponse:
    internal_bot = await service.internal_bot.get_by_id_like(bot_uid)
    if not internal_bot:
        return JsonResponse(content=ApiErrorCode.NF3004, status_code=status.HTTP_404_NOT_FOUND)

    return JsonResponse(content={"internal_bot": internal_bot.api_response(is_setting=user.is_admin)})


@AppRouter.schema()
@AppRouter.api.get(
    "/global/bots",
    tags=["Global"],
    responses=OpenApiSchema().suc({"bots": Bot.api_schema()}).auth().forbidden().get(),
)
@AuthFilter.add()
async def get_bots(service: DomainService = DomainService.scope()) -> JsonResponse:
    bots = await service.bot.get_api_list(False)

    return JsonResponse(content={"bots": bots})
