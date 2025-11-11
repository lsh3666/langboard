from threading import Lock
from typing import TypeVar


_TClass = TypeVar("_TClass", bound=type)


def thread_safe_singleton(cls: _TClass) -> _TClass:
    """Converts a class into a thread-safe singleton."""
    if not hasattr(thread_safe_singleton, "__lock__"):
        setattr(thread_safe_singleton, "__lock__", Lock())

    def get_instance(**kwargs):
        if not hasattr(cls, "__instance__"):
            with getattr(thread_safe_singleton, "__lock__"):
                if not hasattr(cls, "__instance__"):
                    setattr(cls, "__instance__", cls(**kwargs))
                    cls.__new__ = get_instance  # type: ignore
                    cls.__init__ = get_instance  # type: ignore
        return getattr(cls, "__instance__")

    return get_instance  # type: ignore
