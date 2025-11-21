from pathlib import Path
from typing import Literal
from alembic import command as alembic_command
from alembic.config import Config as AlembicConfig
from langboard_shared.core.logger import Logger
from langboard_shared.core.utils.StringCase import StringCase
from langboard_shared.Env import Env
from pydantic import BaseModel
from ..Constants import BASE_DIR


logger = Logger.use("cli")

_TPyConfigType = Literal["model", "task", "publisher", "command", "seed"]
_TFactoryPyConfigType = Literal["domain_service", "repository"]


SHARED_DIR = BASE_DIR / ".." / ".." / "shared" / "py" / "langboard_shared"


def _get_py_config(config_type: _TPyConfigType):
    class _TPyConfig(BaseModel):
        dirpath: Path
        filename: str
        should_update_init: bool

    config_map: dict[_TPyConfigType, _TPyConfig] = {
        "model": _TPyConfig(
            dirpath=SHARED_DIR / "domain" / "models",
            filename="{name}.py",
            should_update_init=True,
        ),
        "task": _TPyConfig(
            dirpath=SHARED_DIR / "tasks",
            filename="{name}Task.py",
            should_update_init=False,
        ),
        "publisher": _TPyConfig(
            dirpath=SHARED_DIR / "publishers",
            filename="{name}Publisher.py",
            should_update_init=True,
        ),
        "command": _TPyConfig(
            dirpath=BASE_DIR / "commands",
            filename="{name}Command.py",
            should_update_init=False,
        ),
        "seed": _TPyConfig(
            dirpath=BASE_DIR / "migrations" / "seeds",
            filename="{name}Seed.py",
            should_update_init=True,
        ),
    }

    return config_map.get(config_type, None)


def _get_factory_py_config(config_type: _TFactoryPyConfigType):
    class _TPyConfig(BaseModel):
        dirpath: Path
        filename: str
        should_update_init: bool
        main_factory: Path

    config_map: dict[_TFactoryPyConfigType, _TPyConfig] = {
        "domain_service": _TPyConfig(
            dirpath=SHARED_DIR / "domain" / "services" / "factory",
            filename="{name}Service.py",
            should_update_init=True,
            main_factory=SHARED_DIR / "domain" / "services" / "DomainService.py",
        ),
        "repository": _TPyConfig(
            dirpath=SHARED_DIR / "infrastructure" / "repositories" / "factory",
            filename="{name}Repository.py",
            should_update_init=True,
            main_factory=SHARED_DIR / "infrastructure" / "repositories" / "Repository.py",
        ),
    }

    return config_map.get(config_type, None)


def make_name(name: str, remove_ends: str | None = None) -> str:
    name = StringCase(name).to_pascal()
    if remove_ends and (name.endswith(remove_ends) or name.endswith(remove_ends.lower())):
        name = name[: -len(remove_ends)]

    return name


def format_template(file_name: str, formats: dict[str, str]) -> str:
    template_path = get_template_path(f"{file_name}.py")
    formats["empty_dict"] = "{}"
    formats["sb"] = "{"
    formats["eb"] = "}"
    return template_path.read_text().format_map(formats)


def create_py(config_type: _TPyConfigType, name: str, code: str) -> None:
    config = _get_py_config(config_type)
    if not config:
        raise ValueError(f"Py config type: {config_type}")

    file_name = config.filename.format(name=name)
    save_path = config.dirpath / file_name

    config.dirpath.mkdir(parents=True, exist_ok=True)

    if save_path.exists():
        raise FileExistsError(f"{config_type.capitalize()} already exists: {name}")

    with open(save_path, "w") as f:
        f.write(code)
        f.close()

    logger.info(f"Created {config_type}: {name}")

    if config.should_update_init:
        update_init_py(config.dirpath)


def create_factory_py(
    config_type: _TFactoryPyConfigType, name: str, code: str, factory: tuple[str, str] | None = None
) -> None:
    config = _get_factory_py_config(config_type)
    if not config:
        raise ValueError(f"Py config type: {config_type}")

    if factory:
        config.dirpath = config.dirpath / factory[0]

    class_name = f"{name}{factory[1]}" if factory else name
    file_name = config.filename.format(name=class_name)
    save_path = config.dirpath / file_name
    target_factory = config.dirpath.parent / config.filename.format(name=factory[1]) if factory else config.main_factory
    target_factory.parent.mkdir(parents=True, exist_ok=True)

    if save_path.exists():
        raise FileExistsError(f"Service already exists: {name}")

    with open(save_path, "w") as f:
        f.write(code)
        f.close()

    logger.info(f"Created factory: {save_path}")

    update_init_py(config.dirpath)

    target_factory_code = target_factory.read_text()
    codes = [target_factory_code]
    codes.append("    @property")
    codes.append(f"    def {StringCase(name).to_snake()}(self):")
    codes.append(f"        return self._create_or_get_product(factory.{'.'.join(file_name.split('.')[:-1])})\n")

    with open(target_factory, "w") as f:
        f.write("\n".join(codes))
        f.close()

    logger.info(f"Updated factory imports: {target_factory}")


def get_template_path(file_name: str) -> Path:
    return Path(__file__).parent / "templates" / f"{file_name}.template"


def update_init_py(target_dir: Path) -> None:
    init_path = target_dir / "__init__.py"
    existed_names: list[str] = []
    for file in target_dir.glob("*.py"):
        if file.name.count("__") > 1 or file.name.startswith("Base") or file.name.replace(".py", "").endswith("Types"):
            continue

        existed_names.append(file.stem)

    with open(init_path, "w") as f:
        for existed_name in existed_names:
            f.write(f"from .{existed_name} import {existed_name}\n")
        f.write("\n\n__all__ = [\n")
        for existed_name in existed_names:
            f.write(f'    "{existed_name}",\n')
        f.write("]\n")
        f.close()

    logger.info(f"Updated init file: {init_path}")


def run_db_command(command: Literal["upgrade", "downgrade", "migrate"], *args, **kwargs) -> None:
    alembic_config = AlembicConfig(str(Env.ROOT_DIR / "alembic.ini"))

    if command == "upgrade":
        alembic_command.upgrade(alembic_config, *args, **kwargs)
    elif command == "downgrade":
        alembic_command.downgrade(alembic_config, *args, **kwargs)
    elif command == "migrate":
        alembic_command.revision(alembic_config, *args, **kwargs)
    else:
        raise ValueError("Unknown db command.")
