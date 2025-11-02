from langboard_shared.core.bootstrap import BaseCommand, BaseCommandOptions
from langboard_shared.core.utils.StringCase import StringCase
from .CommandUtils import create_py, format_template, make_name


class CreateSeedCommandOptions(BaseCommandOptions):
    pass


class CreateSeedCommand(BaseCommand):
    @staticmethod
    def is_only_in_dev() -> bool:
        return True

    @property
    def option_class(self) -> type[CreateSeedCommandOptions]:
        return CreateSeedCommandOptions

    @property
    def command(self) -> str:
        return "seed:new"

    @property
    def positional_name(self) -> str:
        return "seed name"

    @property
    def description(self) -> str:
        return "Seed model to create (If you give snake_case or camelCase, it will convert to PascalCase, and it will remove 'Seed' suffix)"

    @property
    def choices(self) -> list[str] | None:
        return None

    @property
    def store_type(self) -> type[bool] | type[str]:
        return str

    def execute(self, seed_name: str, _: CreateSeedCommandOptions) -> None:
        name = make_name(seed_name, "Seed")
        snake_name = StringCase(name).to_snake()

        formats = {
            "class_name": name,
            "snake_name": snake_name,
        }

        model_code = format_template("seed", formats)
        create_py("seed", name, model_code)
