from __future__ import annotations
from typing import ClassVar
from . import DataModel


class RootModel(DataModel):
    TEMPLATE_FILE_PATH: ClassVar[str] = "root.jinja2"
