from __future__ import annotations
from typing import TYPE_CHECKING, ClassVar
from .. import DataModel
from .imports import IMPORT_DATACLASS


if TYPE_CHECKING:
    from ...imports import Import


class DataClass(DataModel):
    TEMPLATE_FILE_PATH: ClassVar[str] = "pydantic/dataclass.jinja2"
    DEFAULT_IMPORTS: ClassVar[tuple[Import, ...]] = (IMPORT_DATACLASS,)
