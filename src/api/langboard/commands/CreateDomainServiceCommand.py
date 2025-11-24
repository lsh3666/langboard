from langboard_shared.core.bootstrap import BaseCommand, BaseCommandOptions
from langboard_shared.core.utils.StringCase import StringCase
from .CommandUtils import create_factory_py, format_template, make_name


class CreateDomainServiceCommandOptions(BaseCommandOptions):
    pass


class CreateDomainServiceCommand(BaseCommand):
    @staticmethod
    def is_only_in_dev() -> bool:
        return True

    @property
    def option_class(self) -> type[CreateDomainServiceCommandOptions]:
        return CreateDomainServiceCommandOptions

    @property
    def command(self) -> str:
        return "domain:new"

    @property
    def positional_name(self) -> str:
        return "domain service name"

    @property
    def description(self) -> str:
        return "Domain service to create (If you give snake_case or camelCase, it will convert to PascalCase, and it will remove 'Service' suffix)"

    @property
    def choices(self) -> list[str] | None:
        return None

    @property
    def store_type(self) -> type[bool] | type[str]:
        return str

    def execute(self, service_name: str, _: CreateDomainServiceCommandOptions) -> None:
        name = make_name(service_name, "Service")

        formats = {
            "class_name": name,
            "snake_name": StringCase(name).to_snake(),
        }

        code = format_template("domain_service", formats)

        create_factory_py("domain_service", name, code)
