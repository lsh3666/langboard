from langboard_shared.core.bootstrap import BaseCommand, BaseCommandOptions
from langboard_shared.core.broker import Broker
from pydantic import Field
from ..Loader import ModuleLoader


class RunBrokerCommandOptions(BaseCommandOptions):
    concurrency: int = Field(default=1, description="Number of workers to run")


class RunBrokerCommand(BaseCommand):
    @staticmethod
    def is_only_in_dev() -> bool:
        return False

    @property
    def option_class(self) -> type[RunBrokerCommandOptions]:
        return RunBrokerCommandOptions

    @property
    def command(self) -> str:
        return "run:broker"

    @property
    def positional_name(self) -> str:
        return ""

    @property
    def description(self) -> str:
        return "Run the broker service"

    @property
    def choices(self) -> list[str] | None:
        return None

    @property
    def store_type(self) -> type[bool] | type[str]:
        return bool

    def execute(self, options: RunBrokerCommandOptions) -> None:
        ModuleLoader.load("tasks", "Task")
        Broker.start(argv=["worker", "--loglevel=info", f"--concurrency={options.concurrency}"])
