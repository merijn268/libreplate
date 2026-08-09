from math import ceil
from typing import Any

from .services.base import Integration
from .services.dirk.integration import DirkIntegration
from .services.usda.integration import USDAIntegration


class FoodIntegrationAPI:
    def __init__(self) -> None:
        self.integrations: list[Integration] = [
            DirkIntegration(),
            USDAIntegration(),
        ]

    def get_integration(self, name: str) -> Integration:
        return next(
            integration for integration in self.integrations if integration.name == name
        )

    def search(
        self,
        query: str,
        services: list[str],
        user: Any,
        limit: int = 20,
    ) -> list[Any]:
        """
        Search enabled integrations and combine their results.

        The requested limit is divided over all enabled integrations to avoid
        one integration consuming all available results. Due to rounding when
        dividing the requested limit between multiple integrations, individual
        integrations may return slightly more results than their exact share.
        The total returned results will not exceed the requested limit.

        Each integration returns a list of `IntegrationFood` DTOs, which
        FoodSerializer can serialize identically to a saved `Food` model.
        """
        enabled_integrations = [
            integration
            for integration in self.integrations
            if integration.name in services
        ]

        if not enabled_integrations:
            return []

        return [
            food
            for integration in enabled_integrations
            for food in integration.search(
                query=query,
                limit=ceil(limit / len(enabled_integrations)),
                user=user,
            )
        ][:limit]

    def add(self, service: str, external_id: str, user: Any) -> Any:
        integration = self.get_integration(service)
        return integration.add(external_id=external_id, user=user)
