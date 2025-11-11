from re import split
from typing import Literal


TStringCase = Literal["upper_snake", "snake", "kebab", "flat", "upper", "pascal", "camel"]


class StringCase:
    def __init__(self, text: str):
        self.__text = text
        self.__case: TStringCase = self.__detect_case()
        self.__raw_chunks = self.__parse_chunks()

    @property
    def case(self) -> TStringCase:
        return self.__case

    def to_flat(self) -> str:
        return "".join(self.__raw_chunks)

    def to_upper(self) -> str:
        return "".join(self.__raw_chunks).upper()

    def to_camel(self) -> str:
        return "".join(
            chunk.capitalize() if index > 0 else chunk.lower() for index, chunk in enumerate(self.__raw_chunks)
        )

    def to_pascal(self) -> str:
        return "".join(chunk.capitalize() for chunk in self.__raw_chunks)

    def to_snake(self) -> str:
        return "_".join(self.__raw_chunks).lower()

    def to_upper_snake(self) -> str:
        return "_".join(self.__raw_chunks).upper()

    def to_kebab(self) -> str:
        return "-".join(self.__raw_chunks).lower()

    def to_language_obj_key(self) -> str:
        return "".join(
            chunk.lower() if index == 0 else chunk.capitalize() for index, chunk in enumerate(self.__raw_chunks)
        )

    def __detect_case(self) -> TStringCase:
        if "_" in self.__text:
            return "upper_snake" if self.__text == self.__text.upper() else "snake"
        elif "-" in self.__text:
            return "kebab"
        elif self.__text.islower():
            return "flat"
        elif self.__text.isupper():
            return "upper"
        elif self.__text[0].isupper():
            return "pascal"
        else:
            return "camel"

    def __parse_chunks(self) -> list[str]:
        if self.__case == "flat" or self.__case == "upper":
            return [self.__text]
        elif self.__case in ["camel", "pascal"]:
            return (
                split(r"(?=[A-Z])", self.__text)
                if self.__case == "camel"
                else split(r"(?<=[a-z])(?=[A-Z])", self.__text)
            )
        elif self.__case in ["snake", "upper_snake"]:
            return self.__text.split("_")
        elif self.__case == "kebab":
            return self.__text.split("-")
        return [self.__text]
