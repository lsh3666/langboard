from __future__ import annotations
from enum import Enum
from functools import cached_property


class DatetimeClassType(Enum):
    Datetime = "datetime"
    Awaredatetime = "AwareDatetime"
    Naivedatetime = "NaiveDatetime"


class PythonVersion(Enum):
    PY_39 = "3.9"
    PY_310 = "3.10"
    PY_311 = "3.11"
    PY_312 = "3.12"
    PY_313 = "3.13"

    @cached_property
    def _is_py_310_or_later(self) -> bool:  # pragma: no cover
        return self.value != self.PY_39.value

    @cached_property
    def _is_py_311_or_later(self) -> bool:  # pragma: no cover
        return self.value not in {self.PY_39.value, self.PY_310.value}

    @property
    def has_union_operator(self) -> bool:  # pragma: no cover
        return self._is_py_310_or_later

    @property
    def has_typed_dict_non_required(self) -> bool:
        return self._is_py_311_or_later

    @property
    def has_kw_only_dataclass(self) -> bool:
        return self._is_py_310_or_later


PythonVersionMin = PythonVersion.PY_39
