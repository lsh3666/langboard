from langboard_shared.core.bootstrap import BaseCommand, BaseCommandOptions
from .CommandUtils import create_py, format_template, make_name


class CreateCmdCommandOptions(BaseCommandOptions):
    pass


class CreateCmdCommand(BaseCommand):
    @staticmethod
    def is_only_in_dev() -> bool:
        return True

    @property
    def option_class(self) -> type[CreateCmdCommandOptions]:
        return CreateCmdCommandOptions

    @property
    def command(self) -> str:
        return "cmd:new"

    @property
    def positional_name(self) -> str:
        return "command name"

    @property
    def description(self) -> str:
        return "Command to create (If you give snake_case or camelCase, it will convert to PascalCase, and it will remove 'Command' suffix)"

    @property
    def choices(self) -> list[str] | None:
        return None

    @property
    def store_type(self) -> type[bool] | type[str]:
        return str

    def execute(self, activity_name: str, _: CreateCmdCommandOptions) -> None:
        name = make_name(activity_name, "Command")

        formats = {
            "class_name": name,
        }

        model_code = format_template("command", formats)
        create_py("command", name, model_code)
