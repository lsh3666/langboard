from __future__ import annotations
from typing import TYPE_CHECKING
from .basereload import BaseReload
from .multiprocess import Multiprocess


if TYPE_CHECKING:
    ChangeReload: type[BaseReload]
else:
    from .statreload import StatReload as ChangeReload

__all__ = ["Multiprocess", "ChangeReload"]
