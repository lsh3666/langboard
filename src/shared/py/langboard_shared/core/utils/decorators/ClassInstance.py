from typing import TypeVar


_TClass = TypeVar("_TClass", bound=object)


def class_instance(*args, **kwargs):
    """Converts a class into a class instance.

    If you want to declare a variable as the same name as the class in the same module, you can use this decorator.

    This decorator returns a function that creates an instance of the class with the given arguments and keyword arguments.

    It does not change the behavior of the class.

    E.g.::

        @class_instance(init args, init kwargs)
        class ClassInstance:
            ...
    """

    def cls(cls: type[_TClass]) -> _TClass:
        return cls(*args, **kwargs)

    return cls
