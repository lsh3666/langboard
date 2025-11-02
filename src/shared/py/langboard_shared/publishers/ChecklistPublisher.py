from ..core.publisher import BaseSocketPublisher, SocketPublishModel
from ..core.routing import SocketTopic
from ..core.utils.decorators import staticclass
from ..models import Card, Checklist


@staticclass
class ChecklistPublisher(BaseSocketPublisher):
    @staticmethod
    async def created(card: Card, checklist: Checklist):
        model = {"checklist": {**checklist.api_response(), "checkitems": []}}
        topic_id = card.project_id.to_short_code()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:card:checklist:created:{card.get_uid()}",
            data_keys="checklist",
        )

        await ChecklistPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def title_changed(card: Card, checklist: Checklist):
        model = {"uid": checklist.get_uid(), "title": checklist.title}
        topic_id = card.project_id.to_short_code()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:card:checklist:title:changed:{card.get_uid()}",
            data_keys=list(model.keys()),
        )

        await ChecklistPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def order_changed(card: Card, checklist: Checklist):
        model = {"uid": checklist.get_uid(), "order": checklist.order}
        topic_id = card.project_id.to_short_code()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:card:checklist:order:changed:{card.get_uid()}",
            data_keys=list(model.keys()),
        )

        await ChecklistPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def checked_changed(card: Card, checklist: Checklist):
        model = {"uid": checklist.get_uid(), "is_checked": checklist.is_checked}
        topic_id = card.project_id.to_short_code()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:card:checklist:checked:changed:{card.get_uid()}",
            data_keys=list(model.keys()),
        )

        await ChecklistPublisher.put_dispather(model, publish_model)

    @staticmethod
    async def deleted(card: Card, checklist: Checklist):
        model = {"uid": checklist.get_uid()}
        topic_id = card.project_id.to_short_code()
        publish_model = SocketPublishModel(
            topic=SocketTopic.Board,
            topic_id=topic_id,
            event=f"board:card:checklist:deleted:{card.get_uid()}",
            data_keys="uid",
        )

        await ChecklistPublisher.put_dispather(model, publish_model)
