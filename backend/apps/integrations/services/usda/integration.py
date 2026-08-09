from apps.foods.models import Food
from apps.integrations.services.base import Integration
from apps.nutrients.models import Nutrient

from .client import usda_client


class USDAIntegration(Integration):
    @property
    def name(self) -> str:
        return "USDA"

    def add(self, external_id, user=None):
        pass

    def search(self, query, limit=20, user=None):
        foods = usda_client.search(
            query,
            page_size=min(limit, 50),
        )

        return [
            self._to_food(
                food,
                user=user,
            )
            for food in foods
        ]

    def get(self, external_id, user=None):
        food_data = usda_client.get_food(int(external_id))
        food = usda_client.create_usda_food(food_data)
        return self._to_food(food, user=user)

    def _to_food(
        self,
        food,
        user=None,
    ):
        instance = Food(
            user=user,
            name=food.name,
            serving=food.serving,
            brand=food.brand,
            description=food.description,
            external_source="USDA FDC",
            external_id=food.fdc_id,
        )

        instance._integration_source = "USDA"
        instance._external_id = str(food.fdc_id)

        instance._integration_nutrients = self._map_nutrients(food.food_nutrients)

        return instance

    def _map_nutrients(
        self,
        nutrients,
    ):
        result = []

        nutrient_map = {
            nutrient.usda_nutrient_number: nutrient
            for nutrient in Nutrient.objects.filter(
                usda_nutrient_number__isnull=False,
            )
        }

        for item in nutrients:
            if item.number is None:
                continue

            nutrient = nutrient_map.get(int(item.number))

            if not nutrient:
                continue

            result.append(
                {
                    "nutrient": nutrient,
                    "amount": float(item.value),
                }
            )

        return result
