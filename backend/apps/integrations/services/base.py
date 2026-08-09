from abc import ABC, abstractmethod
from typing import Any


class Integration(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    def search(self, query: str, limit: int, user: Any) -> list[Any]:
        pass

    @abstractmethod
    def add(self, external_id: str, user: Any) -> Any:
        pass
