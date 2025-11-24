from langboard_shared.core.bootstrap import BaseCommand, BaseCommandOptions
from langboard_shared.core.utils.StringCase import StringCase
from .CommandUtils import create_factory_py, format_template, make_name


class CreateRepositoryCommandOptions(BaseCommandOptions):
    pass


class CreateRepositoryCommand(BaseCommand):
    @staticmethod
    def is_only_in_dev() -> bool:
        return True

    @property
    def option_class(self) -> type[CreateRepositoryCommandOptions]:
        return CreateRepositoryCommandOptions

    @property
    def command(self) -> str:
        return "repo:new"

    @property
    def positional_name(self) -> str:
        return "repository name"

    @property
    def description(self) -> str:
        return "Repository to create (If you give snake_case or camelCase, it will convert to PascalCase, and it will remove 'Repository' suffix)"

    @property
    def choices(self) -> list[str] | None:
        return None

    @property
    def store_type(self) -> type[bool] | type[str]:
        return str

    def execute(self, repository_name: str, _: CreateRepositoryCommandOptions) -> None:
        name = make_name(repository_name, "Repository")

        formats = {
            "class_name": name,
            "snake_name": StringCase(name).to_snake(),
        }

        code = format_template("repository", formats)

        create_factory_py("repository", name, code)
