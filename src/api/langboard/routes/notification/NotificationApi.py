from typing import Literal, cast
from fastapi import Depends
from langboard_shared.core.filter import AuthFilter
from langboard_shared.core.routing import AppRouter, JsonResponse
from langboard_shared.core.schema import OpenApiSchema
from langboard_shared.models import User, UserNotification
from langboard_shared.security import Auth
from langboard_shared.services import Service
from .NotificationForm import NotificationForm


@AppRouter.api.get(
    "/notifications",
    tags=["Notification"],
    responses=OpenApiSchema().suc({"notifications": [UserNotification]}).auth().forbidden().get(),
)
@AuthFilter.add("user")
async def toggle_all_notification_subscription(
    form: NotificationForm = Depends(), user: User = Auth.scope("user"), service: Service = Service.scope()
) -> JsonResponse:
    if form.time_range not in ["3d", "7d", "1m", "all"]:
        form.time_range = "3d"
    notifications = await service.notification.get_list(user, cast(Literal["3d", "7d", "1m", "all"], form.time_range))
    return JsonResponse(content={"notifications": notifications})
