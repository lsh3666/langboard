from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.filter import RoleFilter
from langboard_shared.models import ProjectRole, User
from langboard_shared.models.ProjectRole import ProjectRoleAction
from langboard_shared.models.UserNotification import NotificationType
from langboard_shared.security import Auth, RoleFinder
from langboard_shared.services import Service
from .NotificationSettingForm import NotificationSettingForm, NotificationSettingTypeForm


@AppRouter.api.put(
    "/notification/settings/all",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notification_types": [NotificationType]}).auth().forbidden().get(),
)
@AuthFilter.add("user")
async def toggle_all_notification_subscription(
    form: NotificationSettingForm, user: User = Auth.scope("user"), service: Service = Service.scope()
) -> JsonResponse:
    notification_types = await service.user_notification_setting.toggle_all(user, form.channel, form.is_unsubscribed)
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]}
    )


@AppRouter.api.put(
    "/notification/settings/type",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notification_types": [NotificationType]}).auth().forbidden().get(),
)
@AuthFilter.add("user")
async def toggle_all_type_notification_subscription(
    form: NotificationSettingTypeForm, user: User = Auth.scope("user"), service: Service = Service.scope()
) -> JsonResponse:
    if form.notification_type not in NotificationType and form.notification_type not in NotificationType._member_names_:
        return JsonResponse(content={"notification_types": []})

    notification_types = await service.user_notification_setting.toggle_type(
        user, form.channel, form.notification_type, form.is_unsubscribed
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]}
    )


@AppRouter.api.put(
    "/notification/settings/project",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notification_types": [NotificationType]}).auth().forbidden().get(),
)
@AuthFilter.add("user")
async def toggle_all_project_notification_subscription(
    form: NotificationSettingForm, user: User = Auth.scope("user"), service: Service = Service.scope()
) -> JsonResponse:
    notification_types = await service.user_notification_setting.toggle_project(
        user, form.channel, form.is_unsubscribed
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]}
    )


@AppRouter.api.put(
    "/notification/settings/column",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notification_types": [NotificationType]}).auth().forbidden().get(),
)
@AuthFilter.add("user")
async def toggle_all_column_notification_subscription(
    form: NotificationSettingForm, user: User = Auth.scope("user"), service: Service = Service.scope()
) -> JsonResponse:
    notification_types = await service.user_notification_setting.toggle_column(user, form.channel, form.is_unsubscribed)
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]}
    )


@AppRouter.api.put(
    "/notification/settings/card",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notification_types": [NotificationType]}).auth().forbidden().get(),
)
@AuthFilter.add("user")
async def toggle_all_card_notification_subscription(
    form: NotificationSettingForm, user: User = Auth.scope("user"), service: Service = Service.scope()
) -> JsonResponse:
    notification_types = await service.user_notification_setting.toggle_card(user, form.channel, form.is_unsubscribed)
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]}
    )


@AppRouter.api.put(
    "/notification/settings/wiki",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notification_types": [NotificationType]}).auth().forbidden().get(),
)
@AuthFilter.add("user")
async def toggle_all_wiki_notification_subscription(
    form: NotificationSettingForm, user: User = Auth.scope("user"), service: Service = Service.scope()
) -> JsonResponse:
    notification_types = await service.user_notification_setting.toggle_wiki(user, form.channel, form.is_unsubscribed)
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]}
    )


@AppRouter.api.put(
    "/notification/settings/project/{project_uid}",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notification_types": [NotificationType]}).auth().forbidden().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add("user")
async def toggle_project_notification_subscription(
    project_uid: str,
    form: NotificationSettingForm,
    user: User = Auth.scope("user"),
    service: Service = Service.scope(),
) -> JsonResponse:
    notification_types = await service.user_notification_setting.toggle_project(
        user, form.channel, form.is_unsubscribed, project_uid
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]}
    )


@AppRouter.api.put(
    "/notification/settings/project/{project_uid}/column/{column_uid}",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notification_types": [NotificationType]}).auth().forbidden().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add("user")
async def toggle_column_notification_subscription(
    project_uid: str,
    column_uid: str,
    form: NotificationSettingForm,
    user: User = Auth.scope("user"),
    service: Service = Service.scope(),
) -> JsonResponse:
    notification_types = await service.user_notification_setting.toggle_column(
        user, form.channel, form.is_unsubscribed, project_uid, column_uid
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]}
    )


@AppRouter.api.put(
    "/notification/settings/project/{project_uid}/card/{card_uid}",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notification_types": [NotificationType]}).auth().forbidden().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add("user")
async def toggle_card_notification_subscription(
    project_uid: str,
    card_uid: str,
    form: NotificationSettingForm,
    user: User = Auth.scope("user"),
    service: Service = Service.scope(),
) -> JsonResponse:
    notification_types = await service.user_notification_setting.toggle_card(
        user, form.channel, form.is_unsubscribed, project_uid, card_uid
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]}
    )


@AppRouter.api.put(
    "/notification/settings/project/{project_uid}/wiki/{wiki_uid}",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notification_types": [NotificationType]}).auth().forbidden().get(),
)
@RoleFilter.add(ProjectRole, [ProjectRoleAction.Read], RoleFinder.project)
@AuthFilter.add("user")
async def toggle_wiki_notification_subscription(
    project_uid: str,
    wiki_uid: str,
    form: NotificationSettingForm,
    user: User = Auth.scope("user"),
    service: Service = Service.scope(),
) -> JsonResponse:
    notification_types = await service.user_notification_setting.toggle_wiki(
        user, form.channel, form.is_unsubscribed, project_uid, wiki_uid
    )
    return JsonResponse(
        content={"notification_types": [notification_type.value for notification_type in notification_types]}
    )
