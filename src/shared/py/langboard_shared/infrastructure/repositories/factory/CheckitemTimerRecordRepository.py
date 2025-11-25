from typing import Literal
from ....core.db import DbSession, SqlBuilder
from ....core.domain import BaseRepository
from ....core.types.ParamTypes import TCheckitemParam
from ....domain.models import CheckitemTimerRecord
from ....helpers import InfraHelper


class CheckitemTimerRecordRepository(BaseRepository[CheckitemTimerRecord]):
    @staticmethod
    def model_cls():
        return CheckitemTimerRecord

    @staticmethod
    def name() -> str:
        return "checkitem_timer_record"

    def get_by_checkitem_and_arc_type(self, checkitem: TCheckitemParam, arc_type: Literal["first", "last"]):
        checkitem_id = InfraHelper.convert_id(checkitem)
        order_by = (
            CheckitemTimerRecord.column("created_at").asc()
            if arc_type == "first"
            else CheckitemTimerRecord.column("created_at").desc()
        )

        record = None
        with DbSession.use(readonly=True) as db:
            result = db.exec(
                SqlBuilder.select.table(CheckitemTimerRecord)
                .where(CheckitemTimerRecord.column("checkitem_id") == checkitem_id)
                .order_by(order_by)
                .group_by(
                    CheckitemTimerRecord.column("id"),
                    CheckitemTimerRecord.column("created_at"),
                )
                .limit(1)
            )
            record = result.first()
        return record
