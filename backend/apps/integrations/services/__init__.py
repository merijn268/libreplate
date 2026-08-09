from apps.foods.models import FoodNutrient
from apps.nutrients.models import Nutrient


class NutritionEnricher:
    def __init__(self, usda):
        self.usda = usda

    def enrich(self, food):

        results = self.usda.search(
            food.name,
            limit=1,
        )

        if not results:
            return food

        usda_food = results[0]

        self._save_nutrients(
            food,
            usda_food,
        )

        return food

    def _save_nutrients(
        self,
        food,
        usda_food,
    ):

        integration_nutrients = getattr(
            usda_food,
            "_integration_nutrients",
            [],
        )

        nutrients = Nutrient.objects.all()

        nutrient_map = {
            nutrient.usda_nutrient_number: nutrient
            for nutrient in nutrients
            if nutrient.usda_nutrient_number
        }

        for item in integration_nutrients:
            nutrient = nutrient_map.get(item.get("nutrientNumber"))

            if not nutrient:
                continue

            FoodNutrient.objects.update_or_create(
                food=food,
                nutrient=nutrient,
                defaults={
                    "amount": item.get(
                        "amount",
                        0,
                    )
                },
            )
