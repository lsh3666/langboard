from asyncio import run as run_async
from typing import cast
from langboard_shared.core.bootstrap import BaseCommand, BaseCommandOptions
from langboard_shared.core.db import BaseSeed
from langboard_shared.core.utils.StringCase import StringCase
from ..migrations import seeds
from .CommandUtils import logger, make_name


class DbSeedCommandOptions(BaseCommandOptions):
    pass


class DbSeedCommand(BaseCommand):
    @staticmethod
    def is_only_in_dev() -> bool:
        return True

    @property
    def option_class(self) -> type[DbSeedCommandOptions]:
        return DbSeedCommandOptions

    @property
    def command(self) -> str:
        return "db:seed"

    @property
    def positional_name(self) -> str:
        return "seed name"

    @property
    def description(self) -> str:
        return "Seed the database (If you give snake_case or camelCase, it will convert to PascalCase, and it will remove 'Seed' suffix)"

    @property
    def choices(self) -> list[str] | None:
        return None

    @property
    def store_type(self) -> type[bool] | type[str]:
        return str

    def execute(self, name: str, _: DbSeedCommandOptions) -> None:
        name = make_name(name, "Seed")
        name = StringCase(name).to_snake()

        seeder = None
        for seed_model_name in seeds.__all__:
            seed_model = cast(type[BaseSeed], seeds.__dict__[seed_model_name])
            if seed_model.name() != name:
                continue
            seeder = seed_model()
            break

        if not seeder:
            logger.error(f"Seed '{name}' not found.")
            return

        logger.info(f"Seeding '{name}'..")
        try:
            run_async(seeder.execute())
            logger.info(f"Seed '{name}' executed successfully.")
        except Exception as e:
            logger.error(f"Failed to execute seed '{name}': {e}")
