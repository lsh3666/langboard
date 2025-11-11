from importlib import import_module
from os import sep
from pathlib import Path
from types import ModuleType
from typing import Type, TypeVar
from .core.logger import Logger


_TBase = TypeVar("_TBase", bound=Type)


class ModuleLoader:
    def __init__(self, base_dir: str | Path, package_name: str):
        self.__base_dir = Path(base_dir)
        self.__package_name = package_name.split(".", maxsplit=1)[0]

    def load(
        self, dir_path: str, file_pattern: str, base_type: _TBase = Type, log: bool = True
    ) -> dict[str, list[_TBase]]:
        """Loads modules from a directory."""
        target_dir = self.__base_dir / dir_path
        modules = {}
        for filepath in target_dir.glob(f"**{sep}*{file_pattern}.py"):
            if not filepath.is_file():
                continue
            namespaces = []
            for namespace in filepath.parts[::-1][1:]:
                if namespace == self.__package_name:
                    break
                namespaces.insert(0, namespace)
            namespaces.insert(0, self.__package_name)
            namespaces.append(filepath.stem)
            namespace = ".".join(namespaces)

            module = import_module(namespace)
            exports = self.get_exports(namespace, module, base_type)
            modules[namespace] = exports
        if log:
            Logger.main.info(f"Loaded [b green]{file_pattern}[/] modules in [b green]{dir_path}[/]")
        return modules

    def get_exports(self, namespace: str, module: ModuleType, _: _TBase) -> list[_TBase]:
        """Gets exports from a module."""
        exports = [getattr(module, name) for name in dir(module) if not name.startswith("_")]
        exports_within_module = [
            export for export in exports if hasattr(export, "__module__") and export.__module__ == namespace
        ]
        return exports_within_module
