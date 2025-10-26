from typing import Any, ClassVar, Literal, cast, overload
from core.utils.decorators import staticclass
from models import Card, Project, ProjectColumn
from models.bases import (
    BaseBotLogModel,
    BaseBotScheduleModel,
    BaseBotScopeModel,
    BotTriggerCondition,
)
from .ModelHelper import ModelHelper
from .ServiceHelper import ServiceHelper


_TAvailableTargets = Project | ProjectColumn | Card
_TAvailableTargetClass = type[Project] | type[ProjectColumn] | type[Card]
_TBotTypeName = Literal["schedule", "scope", "log"]
_TBaseBotType = BaseBotScheduleModel | BaseBotScopeModel | BaseBotLogModel
_TBaseBotTypeClass = type[BaseBotScheduleModel] | type[BaseBotScopeModel] | type[BaseBotLogModel]


@staticclass
class BotHelper:
    AVAILABLE_TARGET_TABLES: ClassVar[dict[str, _TAvailableTargetClass]] = {
        Project.__tablename__: Project,
        ProjectColumn.__tablename__: ProjectColumn,
        Card.__tablename__: Card,
    }
    AVAILABLE_BOT_TABLES: ClassVar[dict[_TBotTypeName, _TBaseBotTypeClass]] = {
        "schedule": BaseBotScheduleModel,
        "scope": BaseBotScopeModel,
        "log": BaseBotLogModel,
    }
    SUFFIXES: ClassVar[dict[_TBotTypeName, str]] = {
        "schedule": "bot_schedule",
        "scope": "bot_scope",
        "log": "bot_log",
    }

    @overload
    @staticmethod
    def get_bot_model_class(
        class_type: Literal["schedule"], target_table: str
    ) -> type[BaseBotScheduleModel] | None: ...
    @overload
    @staticmethod
    def get_bot_model_class(class_type: Literal["scope"], target_table: str) -> type[BaseBotScopeModel] | None: ...
    @overload
    @staticmethod
    def get_bot_model_class(class_type: Literal["log"], target_table: str) -> type[BaseBotLogModel] | None: ...
    @staticmethod
    def get_bot_model_class(class_type: _TBotTypeName, target_table: str) -> _TBaseBotTypeClass | None:
        if target_table not in BotHelper.AVAILABLE_TARGET_TABLES:
            return None

        base_model_class = BotHelper.AVAILABLE_BOT_TABLES.get(class_type)
        if not base_model_class:
            return None

        model_classes = ModelHelper.get_models_by_base_class(base_model_class)
        if not model_classes:
            return None

        for model_class in model_classes:
            if model_class.__tablename__.startswith(target_table):
                return model_class

        return None

    @overload
    @staticmethod
    def get_target_model_by_param(
        class_type: Literal["schedule"], target_table: str, param: int | str
    ) -> tuple[type[BaseBotScheduleModel], _TAvailableTargets] | None: ...
    @overload
    @staticmethod
    def get_target_model_by_param(
        class_type: Literal["scope"], target_table: str, param: int | str
    ) -> tuple[type[BaseBotScopeModel], _TAvailableTargets] | None: ...
    @overload
    @staticmethod
    def get_target_model_by_param(
        class_type: Literal["log"], target_table: str, param: int | str
    ) -> tuple[type[BaseBotLogModel], _TAvailableTargets] | None: ...
    @staticmethod
    def get_target_model_by_param(
        class_type: _TBotTypeName, target_table: str, param: int | str
    ) -> tuple[_TBaseBotTypeClass, _TAvailableTargets] | None:
        if target_table not in BotHelper.AVAILABLE_TARGET_TABLES:
            return None

        target_schedule_class = BotHelper.get_bot_model_class(class_type, target_table)
        target_class = BotHelper.AVAILABLE_TARGET_TABLES.get(target_table)
        if not target_class or not target_schedule_class:
            return None

        target = ServiceHelper.get_by_param(target_class, param)
        if not target:
            return None

        return target_schedule_class, target

    @overload
    @staticmethod
    def get_target_model_by_bot_model(
        class_type: Literal["schedule"], bot_model: BaseBotScheduleModel
    ) -> _TAvailableTargets | None: ...
    @overload
    @staticmethod
    def get_target_model_by_bot_model(
        class_type: Literal["scope"], bot_model: BaseBotScopeModel
    ) -> _TAvailableTargets | None: ...
    @overload
    @staticmethod
    def get_target_model_by_bot_model(
        class_type: Literal["log"], bot_model: BaseBotLogModel
    ) -> _TAvailableTargets | None: ...
    @staticmethod
    def get_target_model_by_bot_model(class_type: _TBotTypeName, bot_model: _TBaseBotType) -> _TAvailableTargets | None:
        if not bot_model:
            return None

        target_table = BotHelper.get_target_table_by_bot_model(class_type, bot_model.__class__)
        if not target_table:
            return None

        target_class = BotHelper.AVAILABLE_TARGET_TABLES.get(target_table)
        if not target_class:
            return None

        target = ServiceHelper.get_by_param(target_class, getattr(bot_model, f"{target_table}_id"))
        if not target:
            return None

        return target

    @staticmethod
    def get_scope_model_classes_by_condition(condition: BotTriggerCondition):
        model_classes = ModelHelper.get_models_by_base_class(BaseBotScopeModel)
        available_classes: set[type[BaseBotScopeModel]] = set()
        for model_class in model_classes:
            if condition in cast(Any, model_class).get_available_conditions():
                available_classes.add(model_class)
        return available_classes

    @staticmethod
    def get_target_table_by_bot_model(class_type: _TBotTypeName, bot_model: _TBaseBotTypeClass) -> str | None:
        if not bot_model:
            return None

        target_table = bot_model.__tablename__.split(f"_{BotHelper.SUFFIXES[class_type]}")[0]
        if target_table not in BotHelper.AVAILABLE_TARGET_TABLES:
            return None

        return target_table
