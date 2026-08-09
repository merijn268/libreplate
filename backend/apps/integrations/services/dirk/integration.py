from apps.foods.models import Food, FoodNutrient
from apps.integrations.services.base import Integration
from apps.integrations.services.dto import IntegrationFood, IntegrationNutrient
from apps.nutrients.models import Nutrient
from apps.units.models import Unit
from django.core.cache import cache

from .client import DirkClient


class DirkIntegration(Integration):
    @property
    def name(self) -> str:
        return "Dirk"

    def __init__(self) -> None:
        self.client = DirkClient()

    def search(self, query: str, limit: int = 20, user=None) -> list[IntegrationFood]:
        cache_key = f"dirk-search:{query}:{limit}"
        cached_results = cache.get(cache_key)

        if cached_results is None:
            results = self.client.search(query, limit=limit)
            foods = []

            for item in results:
                product = item.get("product") or {}
                product_id = product.get("productId")

                if not product_id:
                    continue

                product_data = self.client.product(int(product_id))
                foods.append(self.client.create_food(product_data))

            cache.set(cache_key, foods, timeout=60 * 30)
            external_foods = foods
        else:
            external_foods = cached_results

        return [self.normalize_food(external_food) for external_food in external_foods]

    def get(self, external_id: str, user=None) -> IntegrationFood:
        product = self.client.product(int(external_id))
        return self.normalize_food(self.client.create_food(product))

    def normalize_food(self, external_food) -> IntegrationFood:
        """
        Turn a provider-specific food (e.g. DirkFood) into the common
        IntegrationFood DTO, resolving nutrients (and, where possible, the
        unit) against our own database records so it renders through
        FoodSerializer exactly like a saved Food.
        """
        nutrients = []

        for external_nutrient in external_food.nutrients:
            nutrient = Nutrient.objects.filter(
                name__iexact=external_nutrient.name,
            ).first()

            if not nutrient:
                continue

            nutrients.append(
                IntegrationNutrient(
                    nutrient=nutrient,
                    amount=float(external_nutrient.amount),
                )
            )

        unit = Unit.objects.filter(abbreviation__iexact=external_food.unit).first()

        return IntegrationFood(
            name=external_food.name,
            serving=external_food.serving,
            unit=unit,
            barcode=external_food.barcode,
            brand=external_food.brand,
            description=external_food.description,
            external_source=external_food.external_source,
            external_id=external_food.external_id,
            nutrients=nutrients,
        )

    def to_food(self, integration_food: IntegrationFood, user) -> Food:
        """
        Convert a (read-only) IntegrationFood into an unsaved Food model
        instance, ready to be persisted. This is the one place an
        IntegrationFood becomes a real Food.
        """
        return Food(
            user=user,
            name=integration_food.name,
            serving=integration_food.serving,
            unit=integration_food.unit,
            barcode=integration_food.barcode,
            brand=integration_food.brand,
            description=integration_food.description,
            external_source=integration_food.external_source,
            external_id=integration_food.external_id,
        )

    def add(self, external_id: str, user) -> Food:
        integration_food = self.get(external_id, user=user)

        food = self.to_food(integration_food, user=user)
        food.save()

        FoodNutrient.objects.bulk_create(
            [
                FoodNutrient(
                    food=food,
                    nutrient=integration_nutrient.nutrient,
                    amount=integration_nutrient.amount,
                )
                for integration_nutrient in integration_food.nutrients
            ]
        )

        return food
