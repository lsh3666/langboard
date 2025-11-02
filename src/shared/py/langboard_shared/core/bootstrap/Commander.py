from argparse import SUPPRESS
from sys import argv, exit
from typing import Any, Never
from pydantic import BaseModel, Field
from rich import print as rprint
from ...Env import Env
from .BaseCommand import BaseCommand
from .CLIHelpFormatter import CLIHelpFormatter
from .CLIRichParser import CLIRichParser


class Commander:
    def __init__(self) -> None:
        self.__commands: dict[str, BaseCommand] = {}

    def add_commands(self, *commands: BaseCommand):
        for command in commands:
            if command.command in self.__commands:
                raise ValueError(f"Command {command.command} already exists")
            if command.command.startswith("-"):
                raise ValueError(f"Command {command.command} cannot start with '-'")
            self.__commands[command.command] = command

    def run(self):
        command_name, value = self.__get_command()

        command = self.__commands[command_name]

        arg_parser = CLIRichParser(argument_default=SUPPRESS, formatter_class=CLIHelpFormatter)
        self.__add_groups(arg_parser, command.option_class)

        args = [arg for arg in argv[1:] if arg != command_name and arg != value]

        if args.count("help") > 0 or value == "help" or (command.store_type is str and not value):
            arg_parser.add_argument(
                *[command_name],
                metavar={
                    "show_usage_only": True,
                    "command_name": command_name,
                    "positional_name": command.positional_name,
                    "choices_description": command.choices_description,
                    "help": command.description,
                },  # type: ignore
            )
            arg_parser.print_help()
            exit(command.store_type is str and not value)

        options, _ = arg_parser.parse_known_args(args=args, namespace=command.option_class())

        if command.store_type is str:
            if isinstance(command.choices, list) and value not in command.choices:
                rprint(
                    f"Invalid value [red]'{value}'[/] for '{command_name}', must be one of {command.choices_description}"
                )
                exit(1)
            command.execute(value, options)
        else:
            command.execute(options)

    def __get_command(self) -> tuple[str, str] | Never:
        command_parser = CLIRichParser(argument_default=SUPPRESS, formatter_class=CLIHelpFormatter)
        command_field = self.__create_command_field()

        class _CLICommandOption(BaseModel):
            command: str | list[str] = command_field
            version: bool = Field(default=False, description="Show version and exit", short="v")  # type: ignore

        self.__add_groups(command_parser, _CLICommandOption)

        args = argv[1:]
        if not args or args[0] == "-h" or args[0] == "--help":
            command_parser.print_help()
            exit(1)

        options, _ = command_parser.parse_known_args(
            args=[arg for arg in args if not arg.startswith("-")], namespace=_CLICommandOption()
        )

        if not options.command or options.command[0] == "help":
            command_parser.print_help()
            exit(0)

        if options.version:
            self.__print_version()
            exit(0)

        if options.command[0] not in self.__commands:
            command_parser.print_help()
            exit(1)

        command = self.__commands[options.command[0]]
        if command.store_type is str:
            return options.command[0], options.command[1] if len(options.command) > 1 else ""
        else:
            return options.command[0], ""

    def __create_command_field(self) -> Any:
        metavar = {}

        for command in self.__commands.values():
            metavar[command.command] = {
                "help": command.description,
                "type": command.store_type,
                "choices": command.choices,
                "choices_description": command.choices_description,
                "positional_name": command.positional_name,
            }

        return Field(
            default=None,
            description="Command",
            is_command=True,  # type: ignore
            nargs="+",  # type: ignore
            metavar=metavar,  # type: ignore
        )

    def __add_groups(self, arg_parser: CLIRichParser, model: type[BaseModel]) -> None:
        for field_name, field in model.model_fields.items():
            field_name = field_name.replace("_", "-")
            names = []
            arg_setting = {
                "help": field.description or None,
                "required": field.is_required(),
                "default": field.default,
            }

            extra = field.json_schema_extra or {}
            if callable(extra):
                extra = {}

            if "is_command" in extra and extra["is_command"]:
                arg_setting.pop("required")
                names.append(field_name)
                if "nargs" in extra:
                    arg_setting["nargs"] = extra["nargs"]
                if "metavar" in extra:
                    arg_setting["metavar"] = extra["metavar"]
                    if "choices" in extra:
                        arg_setting["choices"] = extra["choices"]
            else:
                if "short" in extra:
                    short_name = extra["short"]
                    names.append(f"-{short_name}")

                names.append(f"--{field_name}")

            group = arg_parser

            if field.annotation is int:
                arg_setting["type"] = field.annotation
            elif field.annotation is bool:
                arg_setting["action"] = "store_true"

            group.add_argument(*names, **arg_setting)

    def __print_version(self):
        from platform import python_implementation, python_version, system

        return rprint(
            f"Running {Env.PROJECT_NAME} {Env.PROJECT_VERSION} with {python_implementation()} {python_version()} on {system()}"
        )
