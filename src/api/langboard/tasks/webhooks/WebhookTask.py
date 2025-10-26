from typing import Any
from core.db import DbSession, SqlBuilder
from core.types import SafeDateTime
from httpx import post
from models import AppSetting
from models.AppSetting import AppSettingType
from publishers import AppSettingPublisher
from ...core.broker import Broker
from .utils import WebhookModel


@Broker.wrap_async_task_decorator
async def webhook_task(model: WebhookModel):
    await run_webhook(model.event, model.data)


async def run_webhook(event: str, data: dict[str, Any]):
    settings = _get_webhook_settings()
    if not settings:
        return

    for setting in settings:
        url = setting.get_value()
        if not isinstance(url, str) or not url.strip():
            continue

        res = None
        try:
            res = post(
                url,
                json={"event": event, "data": data},
            )
            res.raise_for_status()

            res = True
        except Exception:
            if res:
                Broker.logger.error("Failed to request webhook: \nURL: %s\nResponse: %s", res.text)
            else:
                Broker.logger.error("Failed to request webhook: \nURL: %s", url)

        if res:
            setting.last_used_at = SafeDateTime.now()
            setting.total_used_count += 1
            with DbSession.use(readonly=False) as db:
                db.update(setting)
            await AppSettingPublisher.setting_updated(
                setting.get_uid(),
                {
                    "last_used_at": setting.last_used_at,
                    "total_used_count": setting.total_used_count,
                },
            )


def _get_webhook_settings() -> list[AppSetting]:
    urls = None
    with DbSession.use(readonly=True) as db:
        result = db.exec(
            SqlBuilder.select.table(AppSetting).where(AppSetting.setting_type == AppSettingType.WebhookUrl)
        )
        urls = result.all()
    if not urls:
        return []
    if not isinstance(urls, list):
        return []

    return urls
