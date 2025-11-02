from langboard_shared.core.bootstrap import BaseCommand, BaseCommandOptions
from .CommandUtils import logger, run_db_command


class DbUpgradeCommandOptions(BaseCommandOptions):
    pass


class DbUpgradeCommand(BaseCommand):
    @staticmethod
    def is_only_in_dev() -> bool:
        return True

    @property
    def option_class(self) -> type[DbUpgradeCommandOptions]:
        return DbUpgradeCommandOptions

    @property
    def command(self) -> str:
        return "db:up"

    @property
    def positional_name(self) -> str:
        return ""

    @property
    def description(self) -> str:
        return "Upgrade the database schema to the latest version"

    @property
    def choices(self) -> list[str] | None:
        return None

    @property
    def store_type(self) -> type[bool] | type[str]:
        return bool

    def execute(self, _: DbUpgradeCommandOptions) -> None:
        run_db_command("upgrade", "head")

        logger.info("Database upgraded to the latest version successfully.")
