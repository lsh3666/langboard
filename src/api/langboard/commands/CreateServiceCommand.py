from langboard_shared.core.bootstrap import BaseCommand, BaseCommandOptions
from langboard_shared.core.utils.StringCase import StringCase
from .CommandUtils import create_service_py, format_template, make_name


class CreateServiceCommandOptions(BaseCommandOptions):
    pass


class CreateServiceCommand(BaseCommand):
    @staticmethod
    def is_only_in_dev() -> bool:
        return True

    @property
    def option_class(self) -> type[CreateServiceCommandOptions]:
        return CreateServiceCommandOptions

    @property
    def command(self) -> str:
        return "service:new"

    @property
    def positional_name(self) -> str:
        return "service name"

    @property
    def description(self) -> str:
        return "Service to create (If you give snake_case or camelCase, it will convert to PascalCase, and it will remove 'Service' suffix)"

    @property
    def choices(self) -> list[str] | None:
        return None

    @property
    def store_type(self) -> type[bool] | type[str]:
        return str

    def execute(self, service_name: str, _: CreateServiceCommandOptions) -> None:
        name = make_name(service_name, "Service")

        formats = {
            "class_name": name,
            "snake_name": StringCase(name).to_snake(),
        }

        code = format_template("service", formats)

        create_service_py(name, code)
