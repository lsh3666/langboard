from typing import Any
from ..core.publisher import BaseSocketPublisher, SocketPublishModel
from ..core.routing import SocketTopic
from ..core.utils.decorators import staticclass
from ..models import (
    Card,
    Checkitem,
    CheckitemTimerRecord,
    Checklist,
    Project,
    ProjectColumn,
    User,
)
from ..models.Checkitem import CheckitemStatus


@staticclass
class CheckitemPublisher(BaseSocketPublisher):
    @staticmethod
    async def created(card: Card, checklist: Checklist, checkitem: Checkitem):
        topic_id = card.get_uid()
        model = {
            "checkitem": {
                **checkitem.api_response(),
                "card_uid": topic_id,
            }
        }
        publish_model = SocketPublishModel(
            topic=SocketTopic.BoardCard,
            topic_id=topic_id,
            event=f"board:card:checkitem:created:{checklist.get_uid()}",
            data_keys=list(model.keys()),
        )

        await CheckitemPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def title_changed(
        project: Project,
        card: Card,
        checkitem: Checkitem,
        cardified_card: Card | None = None,
    ):
        model = {"title": checkitem.title}
        topic_id = card.get_uid()
        project_uid = project.get_uid()
        checkitem_uid = checkitem.get_uid()
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.BoardCard,
                topic_id=topic_id,
                event=f"board:card:checkitem:title:changed:{checkitem_uid}",
                data_keys="title",
            ),
            SocketPublishModel(
                topic=SocketTopic.Dashboard,
                topic_id=project_uid,
                event=f"dashboard:checkitem:title:changed:{project_uid}",
                data_keys="title",
                custom_data={"uid": checkitem_uid},
            ),
        ]

        if cardified_card:
            cardified_card_uid = cardified_card.get_uid()
            publish_models.extend(
                [
                    SocketPublishModel(
                        topic=SocketTopic.Board,
                        topic_id=project_uid,
                        event=f"board:card:details:changed:{cardified_card_uid}",
                        data_keys="title",
                    ),
                    SocketPublishModel(
                        topic=SocketTopic.Dashboard,
                        topic_id=project_uid,
                        event=f"dashboard:card:title:changed:{project_uid}",
                        data_keys="title",
                        custom_data={"uid": cardified_card_uid},
                    ),
                ]
            )

        await CheckitemPublisher.put_dispather(model, publish_models)

    @staticmethod
    async def order_changed(
        card: Card,
        checkitem: Checkitem,
        old_checklist: Checklist | None,
        new_checklist: Checklist | None,
    ):
        model = {"uid": checkitem.get_uid(), "order": checkitem.order}
        topic_id = card.get_uid()
        publish_models: list[SocketPublishModel] = []
        if old_checklist and new_checklist:
            publish_models.extend(
                [
                    SocketPublishModel(
                        topic=SocketTopic.BoardCard,
                        topic_id=topic_id,
                        event=f"board:card:checkitem:order:changed:{new_checklist.get_uid()}",
                        data_keys=["uid", "order"],
                        custom_data={
                            "move_type": "to_column",
                            "column_uid": new_checklist.get_uid(),
                        },
                    ),
                    SocketPublishModel(
                        topic=SocketTopic.BoardCard,
                        topic_id=topic_id,
                        event=f"board:card:checkitem:order:changed:{old_checklist.get_uid()}",
                        data_keys=["uid", "order"],
                        custom_data={
                            "move_type": "from_column",
                            "column_uid": old_checklist.get_uid(),
                        },
                    ),
                ]
            )
        else:
            column_uid = checkitem.checklist_id.to_short_code()
            publish_models.append(
                SocketPublishModel(
                    topic=SocketTopic.BoardCard,
                    topic_id=topic_id,
                    event=f"board:card:checkitem:order:changed:{column_uid}",
                    data_keys=["uid", "order"],
                    custom_data={"move_type": "in_column", "column_uid": column_uid},
                )
            )

        await CheckitemPublisher.put_dispather(model, publish_models)

    @staticmethod
    async def status_changed(
        project: Project,
        card: Card,
        checkitem: Checkitem,
        timer_record: CheckitemTimerRecord,
        target_user: User | None,
    ):
        model = {
            "user": target_user.api_response() if target_user else None,
            "status": checkitem.status,
            "accumulated_seconds": checkitem.accumulated_seconds,
            "is_checked": checkitem.is_checked,
            "timer_started_at": timer_record.created_at if checkitem.status == CheckitemStatus.Started else None,
        }
        topic_id = card.get_uid()
        project_uid = project.get_uid()
        checkitem_uid = checkitem.get_uid()
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.BoardCard,
                topic_id=topic_id,
                event=f"board:card:checkitem:status:changed:{checkitem_uid}",
                data_keys=list(model.keys()),
            ),
            SocketPublishModel(
                topic=SocketTopic.Dashboard,
                topic_id=project_uid,
                event=f"dashboard:checkitem:status:changed:{project_uid}",
                data_keys=list(model.keys()),
                custom_data={"uid": checkitem_uid},
            ),
        ]

        await CheckitemPublisher.put_dispather(model, publish_models)

    @staticmethod
    async def checked_changed(project: Project, card: Card, checkitem: Checkitem):
        model = {"is_checked": checkitem.is_checked}
        project_uid = project.get_uid()
        checkitem_uid = checkitem.get_uid()
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.BoardCard,
                topic_id=card.get_uid(),
                event=f"board:card:checkitem:checked:changed:{checkitem_uid}",
                data_keys="is_checked",
            ),
            SocketPublishModel(
                topic=SocketTopic.Dashboard,
                topic_id=project_uid,
                event=f"dashboard:checkitem:checked:changed:{project_uid}",
                data_keys="is_checked",
                custom_data={"uid": checkitem_uid},
            ),
        ]

        await CheckitemPublisher.put_dispather(model, publish_models)

    @staticmethod
    async def cardified(
        card: Card,
        checkitem: Checkitem,
        target_column: ProjectColumn,
        api_card: dict[str, Any],
    ):
        model = {"card": api_card}
        topic_id = card.project_id.to_short_code()
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.BoardCard,
                topic_id=card.get_uid(),
                event=f"board:card:checkitem:cardified:{checkitem.get_uid()}",
                data_keys="card",
            ),
            SocketPublishModel(
                topic=SocketTopic.Board,
                topic_id=topic_id,
                event=f"board:card:created:{target_column.get_uid()}",
                data_keys="card",
            ),
            SocketPublishModel(
                topic=SocketTopic.Dashboard,
                topic_id=topic_id,
                event=f"dashboard:card:created:{topic_id}",
                custom_data={"column_uid": target_column.get_uid()},
            ),
        ]

        await CheckitemPublisher.put_dispather(model, publish_models)

    @staticmethod
    async def deleted(project: Project, card: Card, checkitem: Checkitem):
        project_uid = project.get_uid()
        model = {"uid": checkitem.get_uid()}
        topic_id = card.get_uid()
        publish_models = [
            SocketPublishModel(
                topic=SocketTopic.BoardCard,
                topic_id=topic_id,
                event=f"board:card:checkitem:deleted:{checkitem.checklist_id.to_short_code()}",
                data_keys="uid",
            ),
            SocketPublishModel(
                topic=SocketTopic.Dashboard,
                topic_id=project_uid,
                event=f"dashboard:checkitem:deleted:{project_uid}",
                data_keys="uid",
            ),
        ]

        await CheckitemPublisher.put_dispather(model, publish_models)
