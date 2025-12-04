from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import ApiErrorCode, ApiException, AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.domain.models import Bot, ProjectRole, User
from langboard_shared.domain.models.ProjectRole import ProjectRoleAction
from langboard_shared.domain.services import DomainService
from langboard_shared.filter import RoleFilter
from langboard_shared.security import Auth, RoleFinder
from .forms import CardCheckRelatedForm, CardifyCheckitemForm, ChangeCardCheckitemStatusForm, ChangeChildOrderForm


@AppRouter.schema(form=CardCheckRelatedForm)
@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/title",
    tags=["Board.Card.Checkitem"],
    description="Change checkitem title.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2011).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add()
async def change_checkitem_title(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    form: CardCheckRelatedForm,
    user_or_bot: User | Bot = Auth.scope("all"),
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    result = await service.checkitem.change_title(user_or_bot, project_uid, card_uid, checkitem_uid, form.title)
    if not result:
        raise ApiException.NotFound_404(ApiErrorCode.NF2011)

    return JsonResponse()


@AppRouter.schema(form=ChangeChildOrderForm)
@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/order",
    tags=["Board.Card.Checkitem"],
    description="Change checkitem order or move to another checklist.",
    responses=OpenApiSchema().auth().forbidden().err(404, ApiErrorCode.NF2011).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add()
async def change_checkitem_order_or_move_checklist(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    form: ChangeChildOrderForm,
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    result = await service.checkitem.change_order(project_uid, card_uid, checkitem_uid, form.order, form.parent_uid)
    if not result:
        raise ApiException.NotFound_404(ApiErrorCode.NF2011)

    return JsonResponse()


@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/status",
    tags=["Board.Card.Checkitem"],
    description="Change checkitem status.",
    responses=OpenApiSchema().auth().forbidden().err(403, ApiErrorCode.PE2003).err(404, ApiErrorCode.NF2011).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add("user")
async def change_checkitem_status(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    form: ChangeCardCheckitemStatusForm,
    user: User = Auth.scope("user"),
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    checkitem = await service.checkitem.get_by_id_like(checkitem_uid)
    if not checkitem:
        raise ApiException.NotFound_404(ApiErrorCode.NF2011)

    if checkitem.user_id and checkitem.user_id != user.id:
        raise ApiException.Forbidden_403(ApiErrorCode.PE2003)

    result = await service.checkitem.change_status(user, project_uid, card_uid, checkitem, form.status, from_api=True)
    if not result:
        raise ApiException.NotFound_404(ApiErrorCode.NF2011)

    return JsonResponse()


@AppRouter.schema(form=CardifyCheckitemForm)
@AppRouter.api.post(
    "/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/cardify",
    tags=["Board.Card.Checkitem"],
    description="Cardify checkitem.",
    responses=OpenApiSchema().auth().forbidden().err(403, ApiErrorCode.PE2003).err(404, ApiErrorCode.NF2011).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add()
async def cardify_checkitem(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    form: CardifyCheckitemForm,
    user_or_bot: User | Bot = Auth.scope("all"),
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    checkitem = await service.checkitem.get_by_id_like(checkitem_uid)
    if not checkitem:
        raise ApiException.NotFound_404(ApiErrorCode.NF2011)

    if checkitem.user_id and checkitem.user_id != user_or_bot.id:
        raise ApiException.Forbidden_403(ApiErrorCode.PE2003)

    cardified_card = await service.checkitem.cardify(
        user_or_bot, project_uid, card_uid, checkitem, form.project_column_uid
    )
    if not cardified_card:
        raise ApiException.NotFound_404(ApiErrorCode.NF2011)

    return JsonResponse()


@AppRouter.schema()
@AppRouter.api.put(
    "/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}/toggle-checked",
    tags=["Board.Card.Checkitem"],
    description="Toggle checkitem checked.",
    responses=OpenApiSchema().auth().forbidden().err(403, ApiErrorCode.PE2003).err(404, ApiErrorCode.NF2011).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add()
async def toggle_checkitem_checked(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    user_or_bot: User | Bot = Auth.scope("all"),
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    checkitem = await service.checkitem.get_by_id_like(checkitem_uid)
    if not checkitem:
        raise ApiException.NotFound_404(ApiErrorCode.NF2011)

    if checkitem.user_id and checkitem.user_id != user_or_bot.id:
        raise ApiException.Forbidden_403(ApiErrorCode.PE2003)

    result = await service.checkitem.toggle_checked(user_or_bot, project_uid, card_uid, checkitem)
    if not result:
        raise ApiException.NotFound_404(ApiErrorCode.NF2011)

    return JsonResponse()


@AppRouter.schema()
@AppRouter.api.delete(
    "/board/{project_uid}/card/{card_uid}/checkitem/{checkitem_uid}",
    tags=["Board.Card.Checkitem"],
    description="Delete checkitem.",
    responses=OpenApiSchema().auth().forbidden().err(403, ApiErrorCode.PE2003).err(404, ApiErrorCode.NF2011).get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.CardUpdate], RoleFinder.project)
@AuthFilter.add()
async def delete_checkitem(
    project_uid: str,
    card_uid: str,
    checkitem_uid: str,
    user_or_bot: User | Bot = Auth.scope("all"),
    service: DomainService = DomainService.scope(),
) -> JsonResponse:
    checkitem = await service.checkitem.get_by_id_like(checkitem_uid)
    if not checkitem:
        raise ApiException.NotFound_404(ApiErrorCode.NF2011)

    if checkitem.user_id and checkitem.user_id != user_or_bot.id:
        raise ApiException.Forbidden_403(ApiErrorCode.PE2003)

    result = await service.checkitem.delete(user_or_bot, project_uid, card_uid, checkitem)
    if not result:
        raise ApiException.NotFound_404(ApiErrorCode.NF2011)
    return JsonResponse()
