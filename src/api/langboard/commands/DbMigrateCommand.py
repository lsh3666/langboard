from langboard_shared.core.bootstrap import BaseCommand, BaseCommandOptions
from .CommandUtils import logger, run_db_command


class DbMigrateCommandOptions(BaseCommandOptions):
    pass


class DbMigrateCommand(BaseCommand):
    @staticmethod
    def is_only_in_dev() -> bool:
        return True

    @property
    def option_class(self) -> type[DbMigrateCommandOptions]:
        return DbMigrateCommandOptions

    @property
    def command(self) -> str:
        return "db:migrate"

    @property
    def positional_name(self) -> str:
        return ""

    @property
    def description(self) -> str:
        return "Create a new database migration file"

    @property
    def choices(self) -> list[str] | None:
        return None

    @property
    def store_type(self) -> type[bool] | type[str]:
        return bool

    def execute(self, _: DbMigrateCommandOptions) -> None:
        run_db_command("migrate", autogenerate=True)

        logger.info("Database migration file created successfully.")
