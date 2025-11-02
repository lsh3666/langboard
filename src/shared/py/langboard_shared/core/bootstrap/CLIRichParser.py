from argparse import ArgumentParser
from rich import print as rprint
from ...Env import Env


COLOR_BASE = "not white bold"
COLOR_POSITIONAL_NAME = "dim"
COLOR_GROUP = "color(138)"
COLOR_COMMAND = "color(153) bold"
COLOR_DESCRIPTION = "color(144)"
COLOR_PROG = "cyan bold"


class CLIRichParser(ArgumentParser):
    def _print_message(self, message, file=None):
        if not message or not message.startswith("usage:"):
            return

        usage_only = None
        options: list[str] = []
        short_options: list[str] = []
        positionals = []
        help_texts = []

        for action in self._actions:
            if action.option_strings:
                for option in action.option_strings:
                    if action.help:
                        help_texts.append(action.help)
                    if option.startswith("--"):
                        options.append(option)
                    else:
                        short_options.append(option)
            else:
                if action.metavar:
                    if "show_usage_only" in action.metavar:
                        usage_only = action
                    else:
                        for metavar in action.metavar:
                            if (
                                "positional_name" in action.metavar[metavar]  # type: ignore
                                and action.metavar[metavar]["positional_name"]  # type: ignore
                            ):
                                positionals.append(f"{metavar} <{action.metavar[metavar]['positional_name']}>")  # type: ignore
                            positionals.append(metavar)
                else:
                    positionals.append(action.dest)

        for positional in positionals:
            message = message.replace(
                f"{positional} options:", f"[{COLOR_GROUP}]{positional.upper()} OPTIONS[/{COLOR_GROUP}]:"
            )

        options_str = f"[{COLOR_GROUP}]OPTIONS[/{COLOR_GROUP}]:"

        message = (
            f"{Env.PROJECT_NAME} [{COLOR_PROG}]v{Env.PROJECT_VERSION}[/{COLOR_PROG}]\n\n{message}".replace(
                "usage:", f"[{COLOR_GROUP}]USAGE[/{COLOR_GROUP}]:"
            )
            .replace("positional arguments:", f"[{COLOR_GROUP}]COMMANDS[/{COLOR_GROUP}]:")
            .replace("options:", options_str)
            .replace(Env.PROJECT_NAME, f"[{COLOR_PROG}]{Env.PROJECT_NAME}[/{COLOR_PROG}]")
        )

        for help_text in help_texts:
            message = message.replace(f"{help_text}", f"[{COLOR_DESCRIPTION}]{help_text}[/{COLOR_DESCRIPTION}]")

        options.extend(short_options)
        for option in options:
            message = message.replace(option, f"[{COLOR_COMMAND}]{option}[/{COLOR_COMMAND}]")

        for positional in positionals:
            if "<" in positional and ">" in positional:
                pos = positional.split(" ")
                pos1 = pos[0]
                pos2 = " ".join(pos[1:]).replace("<", "＜").replace(">", "＞")
                message = message.replace(
                    positional,
                    f"[{COLOR_COMMAND}]{pos1}[/{COLOR_COMMAND}] [{COLOR_POSITIONAL_NAME}]{pos2}[/{COLOR_POSITIONAL_NAME}]",
                )
            else:
                message = (
                    message.replace(f"  {positional} ", f"  [{COLOR_COMMAND}]{positional}[/{COLOR_COMMAND}] ")
                    .replace(f"|{positional}", f"|[{COLOR_COMMAND}]{positional}[/{COLOR_COMMAND}]")
                    .replace(f"{positional}|", f"[{COLOR_COMMAND}]{positional}[/{COLOR_COMMAND}]|")
                )

        if usage_only:
            message = message.replace(
                f"{usage_only.metavar['command_name']} <{usage_only.metavar['positional_name']}>",  # type: ignore
                f"[{COLOR_COMMAND}]{usage_only.metavar['command_name']}[/{COLOR_COMMAND}] ＜[{COLOR_POSITIONAL_NAME}]{usage_only.metavar['positional_name']}[/{COLOR_POSITIONAL_NAME}]＞",  # type: ignore
            ).replace(
                f"<{usage_only.metavar['command_name']}>",  # type: ignore
                f"[{COLOR_COMMAND}]{usage_only.metavar['command_name']}[/{COLOR_COMMAND}]",  # type: ignore
            )  # type: ignore

            lines = message.split("\n")
            start_index = lines.index(options_str) if options_str in lines else -1
            if start_index == -1:
                is_usage = False
                for i in range(len(lines)):
                    line = lines[i]
                    if line.startswith(f"[{COLOR_GROUP}]USAGE[/{COLOR_GROUP}]:"):
                        is_usage = True
                        continue
                    if is_usage and not line:
                        start_index = i + 2
                        break

            description = action.metavar["help"]  # type: ignore
            text_width = self._get_formatter()._width - self._get_formatter()._current_indent

            description_lines = []
            description_chunks = description.split()

            while description_chunks:
                line = " "
                last_index = 0
                for i in range(len(description_chunks)):
                    chunk = description_chunks[i]
                    if len(line) + len(chunk) + 1 > text_width:
                        break
                    last_index = i
                    line = f"{line} {chunk}"
                description_chunks = description_chunks[last_index + 1 :]
                description_lines.append(line)

            if "choices_description" in action.metavar:  # type: ignore
                choices = action.metavar["choices_description"]  # type: ignore
                if isinstance(choices, list):
                    description_lines.extend(["", f"[{COLOR_GROUP}]CHOICES[/{COLOR_GROUP}]:"])
                    description_lines.append(
                        "".join(
                            [
                                f"[/{COLOR_DESCRIPTION}]",
                                "\n".join([f"  - {choice}" for choice in choices] if choices else ["  None"]),
                                f"[{COLOR_DESCRIPTION}]",
                            ]
                        )
                    )

            description_lines = "\n".join(description_lines)

            if start_index == -1:
                lines.extend(["", f"[{COLOR_GROUP}]DESCRIPTION[/{COLOR_GROUP}]:"])
                lines.extend(description_lines)
            else:
                if len(lines) - 1 < start_index:
                    for _ in range(start_index - len(lines) + 1):
                        lines.append("")
                lines = [
                    *lines[:start_index],
                    f"[{COLOR_GROUP}]DESCRIPTION[/{COLOR_GROUP}]:",
                    f"[{COLOR_DESCRIPTION}]{description_lines}[/{COLOR_DESCRIPTION}]",
                    "",
                    *lines[start_index:],
                ]
            message = "\n".join(lines)

        message = f"[{COLOR_BASE}]{message.strip()}[/{COLOR_BASE}]"
        rprint(message)
