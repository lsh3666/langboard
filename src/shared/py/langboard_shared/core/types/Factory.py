from abc import ABC
from contextlib import contextmanager
from typing import Any, Callable, Self, TypeVar
from fastapi import Depends


class IFactoryProduct:
    @staticmethod
    def name() -> str: ...
    def __init__(self, get_product: Callable, get_product_by_name: Callable): ...


_TBaseProduct = TypeVar("_TBaseProduct", bound=IFactoryProduct)


class Factory(ABC):
    def __init__(self):
        self._products: dict[str, IFactoryProduct] = {}

    @classmethod
    def scope(cls) -> Self:
        async def create_factory():
            factory = cls()
            try:
                yield factory
            finally:
                factory.close()

        return Depends(create_factory)

    @classmethod
    @contextmanager
    def use(cls):
        factory = cls()
        yield factory
        factory.close()

    def close(self):
        self._products.clear()

    def _create_or_get_product(self, product: type[_TBaseProduct]) -> _TBaseProduct:
        product_name = product.name()
        if product_name not in self._products:
            self._products[product_name] = product(self._create_or_get_product, self._get_product_by_name)
        target_product: _TBaseProduct = self._products[product_name]  # type: ignore

        return target_product

    def _get_product_by_name(self, name: str) -> Any:
        return getattr(self, name)
