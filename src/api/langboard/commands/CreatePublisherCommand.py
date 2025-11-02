from langboard_shared.core.bootstrap import BaseCommand, BaseCommandOptions
from .CommandUtils import create_py, format_template, make_name


class CreatePublisherCommandOptions(BaseCommandOptions):
    pass


class CreatePublisherCommand(BaseCommand):
    @staticmethod
    def is_only_in_dev() -> bool:
        return True

    @property
    def option_class(self) -> type[CreatePublisherCommandOptions]:
        return CreatePublisherCommandOptions

    @property
    def command(self) -> str:
        return "pub:new"

    @property
    def positional_name(self) -> str:
        return "publisher name"

    @property
    def description(self) -> str:
        return "Publisher to create (If you give snake_case or camelCase, it will convert to PascalCase, and it will remove 'Publisher' suffix)"

    @property
    def choices(self) -> list[str] | None:
        return None

    @property
    def store_type(self) -> type[bool] | type[str]:
        return str

    def execute(self, publisher_name: str, _: CreatePublisherCommandOptions) -> None:
        name = make_name(publisher_name, "Publisher")

        formats = {
            "class_name": name,
        }

        code = format_template("publisher", formats)

        create_py("publisher", name, code)
