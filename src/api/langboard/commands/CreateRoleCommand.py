from langboard_shared.core.bootstrap import BaseCommand, BaseCommandOptions
from .CommandUtils import create_py, create_service_py, format_template, make_name


class CreateRoleCommandOptions(BaseCommandOptions):
    pass


class CreateRoleCommand(BaseCommand):
    @staticmethod
    def is_only_in_dev() -> bool:
        return True

    @property
    def option_class(self) -> type[CreateRoleCommandOptions]:
        return CreateRoleCommandOptions

    @property
    def command(self) -> str:
        return "role:new"

    @property
    def positional_name(self) -> str:
        return "role name"

    @property
    def description(self) -> str:
        return "Role model and service to create (If you give snake_case or camelCase, it will convert to PascalCase, and it will remove 'Role' suffix)"

    @property
    def choices(self) -> list[str] | None:
        return None

    @property
    def store_type(self) -> type[bool] | type[str]:
        return str

    def execute(self, role_name: str, _: CreateRoleCommandOptions) -> None:
        name = make_name(role_name, "Role")

        formats = {
            "class_name": name,
        }

        model_code = format_template("role_sql_model", formats)
        create_py("model", f"{name}Role", model_code)

        service_code = format_template("role_service", formats)
        create_service_py(name, service_code, factory=("roles", "Role"))
