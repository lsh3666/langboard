from typing import Optional
from sqlalchemy import Engine, create_engine
from ...Env import Env
from ..utils.decorators import class_instance, thread_safe_singleton
from .DbConfigHelper import DbConfigHelper


@class_instance()
@thread_safe_singleton
class DbEngine:
    __main_engine: Optional[Engine] = None
    __readonly_engine: Optional[Engine] = None

    def get_main_engine(self) -> Engine:
        if self.__main_engine:
            return self.__main_engine

        url = DbConfigHelper.get_sanitized_driver(Env.MAIN_DATABASE_URL)
        self.__main_engine = create_engine(
            url,
            **DbConfigHelper.create_config(url),
        )
        return self.__main_engine

    def get_readonly_engine(self) -> Engine:
        if self.__readonly_engine:
            return self.__readonly_engine

        url = DbConfigHelper.get_sanitized_driver(Env.READONLY_DATABASE_URL)
        self.__readonly_engine = create_engine(
            url,
            **DbConfigHelper.create_config(url),
        )
        return self.__readonly_engine
