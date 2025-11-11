from typing import Any, Callable, Concatenate, Generic, Literal, ParamSpec, Protocol, TypeVar, overload


_TParams = ParamSpec("_TParams")
_TReturn = TypeVar("_TReturn", covariant=True)


class _Func(Protocol, Generic[_TParams, _TReturn]):
    @overload
    def __call__(self_, *args: _TParams.args, **kwargs: _TParams.kwargs) -> _TReturn: ...  # type: ignore
    @overload
    def __call__(self_, self: Any, *args: _TParams.args, **kwargs: _TParams.kwargs) -> _TReturn: ...  # type: ignore
    def __call__(self_, self: Any, *args: _TParams.args, **kwargs: _TParams.kwargs) -> _TReturn: ...  # type: ignore


def __extract_func_param(
    cls_: Callable[Concatenate[_TParams], Any],
) -> Callable[[Callable[..., _TReturn]], _Func[_TParams, _TReturn]]:
    def spec_decorator(method: Callable[..., _TReturn]) -> _Func[_TParams, _TReturn]:
        def inner(self: Any, *args: _TParams.args, **kwargs: _TParams.kwargs) -> _TReturn:
            return method(self, *args, **kwargs)

        return inner  # type: ignore

    return spec_decorator


@overload
def extract_func_param() -> Callable[
    [Callable[Concatenate[_TParams], Any]], Callable[[Callable[..., _TReturn]], _Func[_TParams, _TReturn]]
]: ...
@overload
def extract_func_param(
    exclude_length: Literal[0],
) -> Callable[
    [Callable[Concatenate[_TParams], Any]], Callable[[Callable[..., _TReturn]], _Func[_TParams, _TReturn]]
]: ...
@overload
def extract_func_param(
    exclude_length: Literal[1],
) -> Callable[
    [Callable[Concatenate[Any, _TParams], Any]], Callable[[Callable[..., _TReturn]], _Func[_TParams, _TReturn]]
]: ...
@overload
def extract_func_param(
    exclude_length: Literal[2],
) -> Callable[
    [Callable[Concatenate[Any, Any, _TParams], Any]],
    Callable[[Callable[..., _TReturn]], _Func[_TParams, _TReturn]],
]: ...
@overload
def extract_func_param(
    exclude_length: Literal[3],
) -> Callable[
    [Callable[Concatenate[Any, Any, Any, _TParams], Any]],
    Callable[[Callable[..., _TReturn]], _Func[_TParams, _TReturn]],
]: ...
@overload
def extract_func_param(
    exclude_length: Literal[4],
) -> Callable[
    [Callable[Concatenate[Any, Any, Any, Any, _TParams], Any]],
    Callable[[Callable[..., _TReturn]], _Func[_TParams, _TReturn]],
]: ...
@overload
def extract_func_param(
    exclude_length: Literal[5],
) -> Callable[
    [Callable[Concatenate[Any, Any, Any, Any, Any, _TParams], Any]],
    Callable[[Callable[..., _TReturn]], _Func[_TParams, _TReturn]],
]: ...
@overload
def extract_func_param(
    exclude_length: Literal[6],
) -> Callable[
    [Callable[Concatenate[Any, Any, Any, Any, Any, Any, _TParams], Any]],
    Callable[[Callable[..., _TReturn]], _Func[_TParams, _TReturn]],
]: ...
@overload
def extract_func_param(
    exclude_length: Literal[7],
) -> Callable[
    [Callable[Concatenate[Any, Any, Any, Any, Any, Any, Any, _TParams], Any]],
    Callable[[Callable[..., _TReturn]], _Func[_TParams, _TReturn]],
]: ...
@overload
def extract_func_param(
    exclude_length: Literal[8],
) -> Callable[
    [Callable[Concatenate[Any, Any, Any, Any, Any, Any, Any, Any, _TParams], Any]],
    Callable[[Callable[..., _TReturn]], _Func[_TParams, _TReturn]],
]: ...
@overload
def extract_func_param(
    exclude_length: Literal[9],
) -> Callable[
    [Callable[Concatenate[Any, Any, Any, Any, Any, Any, Any, Any, Any, _TParams], Any]],
    Callable[[Callable[..., _TReturn]], _Func[_TParams, _TReturn]],
]: ...
def extract_func_param(
    exclude_length: Literal[0, 1, 2, 3, 4, 5, 6, 7, 8, 9] = 0,
) -> Callable[[Callable[..., Any]], Callable[[Callable[..., _TReturn]], _Func[_TParams, _TReturn]]]:
    """Provides a decorator for a model class method that provides type hints for the method's parameters and return value.

    :params exclude_length: The number of parameters to exclude from the model class method.

    E.g.::

        class AnyModel(BaseModel):
            any_field: str
            any_field2: str
            any_field3: str

        class AnyClass:
            @extract_func_param(2)(AnyModel)  # type: ignore
            def any_method(self, **kwargs):
                ...

        AnyClass().any_method(any_field3="any_value") # any_field and any_field2 are excluded from the method's parameters.
    """

    def decorator(cls_: Callable[Concatenate[..., _TParams], Any]):
        return __extract_func_param(cls_)

    return decorator  # type: ignore
