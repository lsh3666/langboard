from langboard_shared.core.bootstrap import BaseCommand, BaseCommandOptions
from .CommandUtils import logger, run_db_command


class DbDowngradeCommandOptions(BaseCommandOptions):
    pass


class DbDowngradeCommand(BaseCommand):
    @staticmethod
    def is_only_in_dev() -> bool:
        return True

    @property
    def option_class(self) -> type[DbDowngradeCommandOptions]:
        return DbDowngradeCommandOptions

    @property
    def command(self) -> str:
        return "db:down"

    @property
    def positional_name(self) -> str:
        return ""

    @property
    def description(self) -> str:
        return "Downgrade the database schema to a previous version"

    @property
    def choices(self) -> list[str] | None:
        return None

    @property
    def store_type(self) -> type[bool] | type[str]:
        return bool

    def execute(self, _: DbDowngradeCommandOptions) -> None:
        run_db_command("downgrade", "-1")

        logger.info("Database downgraded to the previous version successfully.")
