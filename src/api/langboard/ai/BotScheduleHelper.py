from os import environ
from subprocess import run as subprocess_run
from typing import Any, Callable, Literal, TypeVar, cast, overload
from zoneinfo import ZoneInfo
from core.db import BaseSqlModel, DbSession, SqlBuilder
from core.Env import Env
from core.schema import Pagination
from core.types import SafeDateTime, SnowflakeID
from core.utils.decorators import staticclass
from crontab import SPECIALS, CronItem, CronTab, OrderedVariableList
from helpers import ServiceHelper
from models import Bot, BotSchedule
from models.bases import BaseBotScheduleModel
from models.BotSchedule import BotScheduleRunningType, BotScheduleStatus
from psutil import process_iter
from sqlalchemy import tuple_
from ..Constants import CRON_TAB_FILE


_TBotScheduleModel = TypeVar("_TBotScheduleModel", bound=BaseBotScheduleModel)
_TBaseParam = int | str | None


@staticclass
class BotScheduleHelper:
    @overload
    @staticmethod
    async def get_all_by_scope(
        schedule_model_class: type[_TBotScheduleModel],
        bot: Bot | None,
        scope_model: BaseSqlModel | list[BaseSqlModel] | tuple[type[BaseSqlModel], int | list[int]],
        as_api: Literal[False],
        pagination: Pagination | None = None,
        status: BotScheduleStatus | None = None,
        refer_time: SafeDateTime | None = None,
    ) -> list[tuple[_TBotScheduleModel, BotSchedule]]: ...
    @overload
    @staticmethod
    async def get_all_by_scope(
        schedule_model_class: type[_TBotScheduleModel],
        bot: Bot | None,
        scope_model: BaseSqlModel | list[BaseSqlModel] | tuple[type[BaseSqlModel], int | list[int]],
        as_api: Literal[True],
        pagination: Pagination | None = None,
        status: BotScheduleStatus | None = None,
        refer_time: SafeDateTime | None = None,
    ) -> list[dict[str, Any]]: ...
    @staticmethod
    async def get_all_by_scope(
        schedule_model_class: type[_TBotScheduleModel],
        bot: Bot | None,
        scope_model: BaseSqlModel | list[BaseSqlModel] | tuple[type[BaseSqlModel], int | list[int]],
        as_api: bool,
        pagination: Pagination | None = None,
        status: BotScheduleStatus | None = None,
        refer_time: SafeDateTime | None = None,
    ) -> list[tuple[_TBotScheduleModel, BotSchedule]] | list[dict[str, Any]]:
        query = SqlBuilder.select.tables(schedule_model_class, BotSchedule).join(
            BotSchedule,
            BotSchedule.column("id") == schedule_model_class.column("bot_schedule_id"),
        )

        if isinstance(scope_model, list):
            query = query.where(
                schedule_model_class.column(f"{scope_model[0].__tablename__}_id").in_([s.id for s in scope_model])
            )
        elif isinstance(scope_model, tuple):
            scope_model_class, scope_model_id = scope_model
            if isinstance(scope_model_id, list):
                query = query.where(
                    schedule_model_class.column(f"{scope_model_class.__tablename__}_id").in_(scope_model_id)
                )
            else:
                query = query.where(
                    schedule_model_class.column(f"{scope_model_class.__tablename__}_id") == scope_model_id
                )
        else:
            query = query.where(schedule_model_class.column(f"{scope_model.__tablename__}_id") == scope_model.id)

        if bot:
            query = query.where(BotSchedule.column("bot_id") == bot.id)

        if status:
            query = query.where(BotSchedule.column("status") == status)

        if refer_time is not None:
            query = query.where(BotSchedule.column("created_at") <= refer_time)

        if pagination:
            query = query.limit(pagination.limit).offset((pagination.page - 1) * pagination.limit)

        schedules = []
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            schedules = result.all()

        if not as_api:
            return schedules

        api_schedules = []
        for schedule_model, schedule in schedules:
            api_schedule = {
                **schedule.api_response(),
                **schedule_model.api_response(),
            }
            api_schedules.append(api_schedule)

        return api_schedules

    @staticmethod
    def reload_cron():
        if Env.ENVIRONMENT == "development":
            return
        try:
            for process in process_iter(["pid", "name"]):
                if process.name() != "cron":
                    continue
                process.kill()
            subprocess_run(["crontab", "-r"])
            subprocess_run(["crontab", str(CRON_TAB_FILE)])
            subprocess_run(["cron"])
        except Exception:
            pass

    @staticmethod
    def convert_valid_interval_str(interval_str: str) -> str:
        """Convert a string to a valid cron interval string.

        If the string is not valid, return an empty string.
        """
        try:
            job = CronItem()
            job.setall(interval_str)
            interval_str = str(job.slices)
            special = SPECIALS.get(interval_str.replace("@", ""), None)
            if special:
                return special
            return interval_str
        except Exception:
            return ""

    @staticmethod
    def get_default_status_with_dates(
        running_type: BotScheduleRunningType | None,
        start_at: SafeDateTime | None,
        end_at: SafeDateTime | None,
    ) -> tuple[BotScheduleStatus, SafeDateTime | None, SafeDateTime | None] | None:
        if not running_type or running_type == BotScheduleRunningType.Infinite:
            return BotScheduleStatus.Started, None, None

        if BotSchedule.RUNNING_TYPES_WITH_START_AT.count(running_type) > 0 and not start_at:
            return None

        if BotSchedule.RUNNING_TYPES_WITH_END_AT.count(running_type) > 0:
            if not end_at:
                return None

            if start_at and end_at < start_at:
                return None
        else:
            end_at = None

        return BotScheduleStatus.Pending, start_at, end_at

    @staticmethod
    async def schedule(
        schedule_model_class: type[_TBotScheduleModel],
        bot: Bot,
        interval_str: str,
        target_model: BaseSqlModel,
        running_type: BotScheduleRunningType | None = None,
        start_at: SafeDateTime | None = None,
        end_at: SafeDateTime | None = None,
        tz: str | float = "UTC",
    ) -> tuple[BotSchedule, _TBotScheduleModel] | None:
        interval_str = BotScheduleHelper.convert_valid_interval_str(interval_str)
        if not interval_str:
            return None

        interval_str = BotScheduleHelper.__adjust_interval_for_utc(interval_str, tz)

        if not running_type:
            running_type = BotScheduleRunningType.Infinite

        cron = BotScheduleHelper.__get_cron()

        has_changed = BotScheduleHelper.__create_job(cron, interval_str, running_type)

        result = BotScheduleHelper.get_default_status_with_dates(
            running_type=running_type, start_at=start_at, end_at=end_at
        )
        if not result:
            return None
        status, start_at, end_at = result

        bot_schedule = BotSchedule(
            bot_id=bot.id,
            running_type=running_type,
            status=status,
            interval_str=interval_str,
            start_at=start_at,
            end_at=end_at,
        )

        with DbSession.use(readonly=False) as db:
            db.insert(bot_schedule)

        params: dict[str, Any] = {
            "bot_schedule_id": bot_schedule.id,
            f"{target_model.__tablename__}_id": target_model.id,
        }

        schedule_model = schedule_model_class(**params)

        with DbSession.use(readonly=False) as db:
            db.insert(schedule_model)

        if has_changed:
            BotScheduleHelper.__save_cron(cron)

        return bot_schedule, schedule_model

    @staticmethod
    async def reschedule(
        schedule_model_class: type[_TBotScheduleModel],
        schedule_model: _TBotScheduleModel | _TBaseParam,
        interval_str: str | None = None,
        running_type: BotScheduleRunningType | None = None,
        start_at: SafeDateTime | None = None,
        end_at: SafeDateTime | None = None,
        tz: str | float = "UTC",
    ) -> tuple[BotSchedule, _TBotScheduleModel, dict[str, Any]] | None:
        schedule_model = ServiceHelper.get_by_param(schedule_model_class, schedule_model)
        if not schedule_model:
            return None

        bot_schedule = ServiceHelper.get_by_param(BotSchedule, schedule_model.bot_schedule_id)
        if not bot_schedule:
            return None

        model = {}
        has_changed = False
        old_status = bot_schedule.status
        old_interval_str = bot_schedule.interval_str

        cron = None
        if running_type:
            if bot_schedule.running_type != running_type:
                result = BotScheduleHelper.get_default_status_with_dates(
                    running_type=running_type, start_at=start_at, end_at=end_at
                )
                if not result:
                    return None
                status, start_at, end_at = result
                bot_schedule.running_type = running_type
                bot_schedule.status = status
                bot_schedule.start_at = start_at
                bot_schedule.end_at = end_at
                model["running_type"] = running_type.value
                model["status"] = status.value
                model["start_at"] = start_at
                model["end_at"] = end_at

                cron, has_changed = await BotScheduleHelper.change_status(
                    schedule_model_class,
                    schedule_model,
                    status,
                    no_update=True,
                    bot_schedule=bot_schedule,
                )
            else:
                if bot_schedule.start_at != start_at or bot_schedule.end_at != end_at:
                    result = BotScheduleHelper.get_default_status_with_dates(
                        running_type=running_type, start_at=start_at, end_at=end_at
                    )
                    if result:
                        status, _, _ = result
                        bot_schedule.status = status
                        model["status"] = status.value

                if BotSchedule.RUNNING_TYPES_WITH_START_AT.count(running_type) > 0 and start_at:
                    bot_schedule.start_at = start_at
                    model["start_at"] = start_at
                if BotSchedule.RUNNING_TYPES_WITH_END_AT.count(running_type) > 0 and end_at:
                    bot_schedule.end_at = end_at
                    model["end_at"] = end_at

        if interval_str:
            interval_str = BotScheduleHelper.convert_valid_interval_str(interval_str)
            interval_str = BotScheduleHelper.__adjust_interval_for_utc(interval_str, tz)

            if old_interval_str != interval_str:
                bot_schedule.interval_str = interval_str
                model["interval_str"] = interval_str

                if not cron:
                    cron = BotScheduleHelper.__get_cron()

                if (
                    bot_schedule.running_type in BotSchedule.RUNNING_TYPES_WITH_START_AT
                    and bot_schedule.status == BotScheduleStatus.Pending
                ):
                    has_changed = BotScheduleHelper.__create_job(cron, interval_str, running_type) or has_changed
                else:
                    has_changed = BotScheduleHelper.__create_job(cron, interval_str) or has_changed

        with DbSession.use(readonly=False) as db:
            db.update(bot_schedule)

        has_old_intervals = BotScheduleHelper.__has_interval_schedule(old_interval_str, old_status)
        if not has_old_intervals:
            if not cron:
                cron = BotScheduleHelper.__get_cron()
            cron.remove_all(
                comment=f"scheduled {old_interval_str}" if old_status == BotScheduleStatus.Pending else old_interval_str
            )

        if cron and (has_changed or not has_old_intervals):
            BotScheduleHelper.__save_cron(cron)

        return bot_schedule, schedule_model, model

    @staticmethod
    async def unschedule(
        schedule_model_class: type[_TBotScheduleModel],
        schedule_model: _TBotScheduleModel | _TBaseParam,
    ) -> tuple[BotSchedule, _TBotScheduleModel] | None:
        schedule_model = ServiceHelper.get_by_param(schedule_model_class, schedule_model)
        if not schedule_model:
            return None

        bot_schedule = ServiceHelper.get_by_param(BotSchedule, schedule_model.bot_schedule_id)
        if not bot_schedule:
            return None

        cron = BotScheduleHelper.__get_cron()

        status = bot_schedule.status
        interval_str = bot_schedule.interval_str
        with DbSession.use(readonly=False) as db:
            db.delete(bot_schedule)

        has_interval = BotScheduleHelper.__has_interval_schedule(interval_str, status)
        if not has_interval:
            cron.remove_all(
                comment=f"scheduled {interval_str}" if status == BotScheduleStatus.Pending else interval_str
            )
            BotScheduleHelper.__save_cron(cron)
        return bot_schedule, schedule_model

    @staticmethod
    async def unschedule_by_scope(schedule_model_class: type[_TBotScheduleModel], scope_model: BaseSqlModel) -> None:
        old_schedules: list[tuple[SnowflakeID, str, BotScheduleStatus]] = []
        with DbSession.use(readonly=True) as db:
            query = (
                SqlBuilder.select.columns(BotSchedule.id, BotSchedule.interval_str, BotSchedule.status)
                .join(
                    schedule_model_class,
                    BotSchedule.column("id") == schedule_model_class.column("bot_schedule_id"),
                )
                .where(schedule_model_class.column(f"{scope_model.__tablename__}_id") == scope_model.id)
            )
            result = db.exec(query)
            old_schedules = cast(Any, result.all())

        with DbSession.use(readonly=False) as db:
            db.exec(
                SqlBuilder.delete.table(BotSchedule).where(
                    BotSchedule.column("id").in_([old_schedule[0] for old_schedule in old_schedules])
                )
            )

        cron = BotScheduleHelper.__get_cron()
        schedule_id_has_schedules = BotScheduleHelper.__has_interval_schedule(
            [(old_schedule[1], old_schedule[2]) for old_schedule in old_schedules]
        )
        schedule_id_has_schedules = set(schedule_id_has_schedules)

        for old_schedule_id, old_interval_str, old_status in old_schedules:
            if old_schedule_id not in schedule_id_has_schedules:
                cron.remove_all(
                    comment=f"scheduled {old_interval_str}"
                    if old_status == BotScheduleStatus.Pending
                    else old_interval_str
                )

        BotScheduleHelper.__save_cron(cron)

    @overload
    @staticmethod
    async def change_status(
        schedule_model_class: type[_TBotScheduleModel],
        schedule_model: _TBotScheduleModel | _TBaseParam,
        status: BotScheduleStatus,
        no_update: None = None,
        bot_schedule: BotSchedule | None = None,
    ) -> BotSchedule | None: ...
    @overload
    @staticmethod
    async def change_status(
        schedule_model_class: type[_TBotScheduleModel],
        schedule_model: _TBotScheduleModel | _TBaseParam,
        status: BotScheduleStatus,
        no_update: Literal[False],
        bot_schedule: BotSchedule | None = None,
    ) -> BotSchedule | None: ...
    @overload
    @staticmethod
    async def change_status(
        schedule_model_class: type[_TBotScheduleModel],
        schedule_model: _TBotScheduleModel | _TBaseParam,
        status: BotScheduleStatus,
        no_update: Literal[True],
        bot_schedule: BotSchedule | None = None,
    ) -> tuple[CronTab, bool]: ...
    @staticmethod
    async def change_status(
        schedule_model_class: type[_TBotScheduleModel],
        schedule_model: _TBotScheduleModel | _TBaseParam,
        status: BotScheduleStatus,
        no_update: bool | None = None,
        bot_schedule: BotSchedule | None = None,
    ) -> BotSchedule | tuple[CronTab, bool] | None:
        schedule_model = ServiceHelper.get_by_param(schedule_model_class, schedule_model)
        cron = BotScheduleHelper.__get_cron()
        if not schedule_model:
            return None if not no_update else (cron, False)

        if not bot_schedule:
            bot_schedule = ServiceHelper.get_by_param(BotSchedule, schedule_model.bot_schedule_id)
            if not bot_schedule:
                return None if not no_update else (cron, False)

        old_status = bot_schedule.status
        bot_schedule.status = status
        if not no_update:
            with DbSession.use(readonly=False) as db:
                db.update(bot_schedule)

        has_changed = False
        has_old_intervals = True
        old_comment = bot_schedule.interval_str
        if old_status == BotScheduleStatus.Pending and status == BotScheduleStatus.Started:
            has_changed = BotScheduleHelper.__create_job(cron, bot_schedule.interval_str)
            has_old_intervals = BotScheduleHelper.__has_interval_schedule(bot_schedule.interval_str, old_status)
            old_comment = f"scheduled {bot_schedule.interval_str}"
        elif old_status == BotScheduleStatus.Started and status == BotScheduleStatus.Pending:
            has_changed = BotScheduleHelper.__create_job(cron, bot_schedule.interval_str, bot_schedule.running_type)
            has_old_intervals = BotScheduleHelper.__has_interval_schedule(bot_schedule.interval_str, old_status)
        elif old_status == BotScheduleStatus.Started and status == BotScheduleStatus.Stopped:
            has_old_intervals = BotScheduleHelper.__has_interval_schedule(bot_schedule.interval_str, old_status)
        elif old_status == BotScheduleStatus.Stopped and status == BotScheduleStatus.Started:
            has_changed = BotScheduleHelper.__create_job(cron, bot_schedule.interval_str)
        elif old_status == BotScheduleStatus.Pending and status == BotScheduleStatus.Stopped:
            has_old_intervals = BotScheduleHelper.__has_interval_schedule(bot_schedule.interval_str, old_status)
            old_comment = f"scheduled {bot_schedule.interval_str}"
        elif old_status == BotScheduleStatus.Stopped and status == BotScheduleStatus.Pending:
            has_changed = BotScheduleHelper.__create_job(cron, bot_schedule.interval_str, bot_schedule.running_type)

        if not has_old_intervals:
            cron.remove_all(comment=old_comment)

        if has_changed or not has_old_intervals:
            BotScheduleHelper.__save_cron(cron)
        return bot_schedule if not no_update else (cron, has_changed)

    @staticmethod
    def __get_cron():
        if not CRON_TAB_FILE.exists():
            CRON_TAB_FILE.parent.mkdir(parents=True, exist_ok=True)
            CRON_TAB_FILE.touch()
        cron = CronTab(user=False, tabfile=str(CRON_TAB_FILE))
        if Env.ENVIRONMENT != "development":
            if cron.env is None:
                cron.env = OrderedVariableList()
            cron.env.update(environ)

        if Env.ENVIRONMENT == "development":
            cron.env = OrderedVariableList()

        return cron

    @staticmethod
    def __create_job(
        cron: CronTab,
        interval_str: str,
        running_type: BotScheduleRunningType | None = None,
    ) -> bool:
        comment = None
        if running_type:
            if BotSchedule.RUNNING_TYPES_WITH_START_AT.count(running_type) > 0:
                comment = f"scheduled {interval_str}"
        if comment is None:
            comment = interval_str

        has_job = False
        for job in cron.find_comment(comment):
            has_job = True
            break

        if has_job:
            return False

        job = cron.new(
            command=f"/app/scripts/run_bot_cron.sh '{comment}'",
            comment=comment,
            user="/bin/bash",
        )
        job.setall(interval_str)
        return True

    @staticmethod
    def __save_cron(cron: CronTab):
        if Env.ENVIRONMENT == "development":
            return
        cron.write()
        BotScheduleHelper.reload_cron()

    @overload
    @staticmethod
    def __has_interval_schedule(interval_str: str, status: BotScheduleStatus) -> bool: ...
    @overload
    @staticmethod
    def __has_interval_schedule(
        interval_str: list[tuple[str, BotScheduleStatus]],
    ) -> list[SnowflakeID]: ...
    @staticmethod
    def __has_interval_schedule(
        interval_str: str | list[tuple[str, BotScheduleStatus]],
        status: BotScheduleStatus | None = None,
    ) -> bool | list[SnowflakeID]:
        if status is None:
            interval_str = cast(list[tuple[str, BotScheduleStatus]], interval_str)
            query = SqlBuilder.select.column(BotSchedule.id).where(
                tuple_(BotSchedule.column("interval_str"), BotSchedule.column("status")).in_(interval_str)
            )
        else:
            interval_str = cast(str, interval_str)
            query = (
                SqlBuilder.select.table(BotSchedule)
                .where((BotSchedule.column("interval_str") == interval_str) & (BotSchedule.column("status") == status))
                .limit(1)
            )

        result = False
        with DbSession.use(readonly=True) as db:
            result = db.exec(query)
            if status is None:
                result = cast(list[SnowflakeID], result.all())
            else:
                result = bool(result.first())
        return result

    @staticmethod
    def __adjust_interval_for_utc(interval_str: str, tz: str | float) -> str:
        if isinstance(tz, str):
            try:
                info = ZoneInfo(tz)
                delta = info.utcoffset(SafeDateTime.now())
                if delta is None:
                    tz = 0.0
                else:
                    tz = delta.total_seconds() / 3600.0
            except Exception:
                tz = 0.0

        if tz == 0.0:
            return interval_str

        real_interval_str = interval_str
        special = SPECIALS.get(interval_str.replace("@", ""), None)
        if special:
            real_interval_str = special

        if real_interval_str.lower() == "@reboot":
            return interval_str

        cron_item = CronItem()
        cron_item.setall(interval_str)
        cron_chunks = real_interval_str.split(" ")

        diff_minutes = int((tz - int(tz)) * 60)
        diff_hours = int(tz)

        if diff_minutes != 0 and cron_item.minutes != "*":
            cron_chunks[0] = BotScheduleHelper.__adjust_interval_for_utc_chunk(
                str(cron_item.minutes),
                diff_minutes,
                BotScheduleHelper.__ensure_valid_minute,
                is_minute=True,
            )

        if diff_hours != 0 and cron_item.hours != "*":
            cron_chunks[1] = BotScheduleHelper.__adjust_interval_for_utc_chunk(
                str(cron_item.hours),
                diff_hours,
                BotScheduleHelper.__ensure_valid_hour,
                is_minute=False,
            )

        return " ".join(cron_chunks)

    @staticmethod
    def __adjust_interval_for_utc_chunk(chunk: str, diff: int, ensure: Callable[[int], int], is_minute: bool) -> str:
        parts = chunk.split(",")
        new_chunks: list[str] = []

        for part in parts:
            if part.startswith("*/"):
                interval = int(part[2:])
                max_interval = 60 if is_minute else 24
                if interval == 1:
                    new_chunks.append(part)
                    continue

                tz_intervals = [time for time in range(0, max_interval, interval)]
                new_intervals = sorted({ensure(time - diff) for time in tz_intervals})
                new_chunks.append(",".join(str(time) for time in new_intervals))
            elif part.count("-") == 1:
                start, end = map(int, part.split("-"))
                new_start = ensure(start - diff)
                new_end = ensure(end - diff)
                new_chunks.append(f"{new_start}-{new_end}")
            else:
                new_value = ensure(int(part) - diff)
                new_chunks.append(str(new_value))
        return ",".join(new_chunks)

    @staticmethod
    def __ensure_valid_minute(minute: int) -> int:
        return ((minute % 60) + 60) % 60

    @staticmethod
    def __ensure_valid_hour(hour: int) -> int:
        return ((hour % 24) + 24) % 24
