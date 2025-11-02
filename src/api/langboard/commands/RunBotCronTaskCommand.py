from asyncio import run
from langboard_shared.core.bootstrap import BaseCommand, BaseCommandOptions
from langboard_shared.tasks.bots import BotScheduleTask


class RunBotCronTaskCommandOptions(BaseCommandOptions):
    pass


class RunBotCronTaskCommand(BaseCommand):
    @staticmethod
    def is_only_in_dev() -> bool:
        return True

    @property
    def option_class(self) -> type[RunBotCronTaskCommandOptions]:
        return RunBotCronTaskCommandOptions

    @property
    def command(self) -> str:
        return "run:bot:cron"

    @property
    def positional_name(self) -> str:
        return "cron interval string"

    @property
    def description(self) -> str:
        return "Run the bot cron task (DO NOT USE THIS COMMAND DIRECTLY)"

    @property
    def choices(self) -> list[str] | None:
        return None

    @property
    def store_type(self) -> type[bool] | type[str]:
        return str

    def execute(self, cron_time_str: str, _: RunBotCronTaskCommandOptions) -> None:
        run(BotScheduleTask.run_scheduled_bots_cron(cron_time_str))
