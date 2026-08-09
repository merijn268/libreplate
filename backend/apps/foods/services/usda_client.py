import requests
from apps.integrations.models import USDAAPISettings


class USDAClient:
    BASE_URL = "https://api.nal.usda.gov/fdc/v1"

    def __init__(self):
        self.api_key = USDAAPISettings.objects.get().key

    def search(self, query, page_size=10):
        response = requests.get(
            f"{self.BASE_URL}/foods/search",
            params={
                "api_key": self.api_key,
                "query": query,
                "pageSize": page_size,
            },
            timeout=20,
        )

        response.raise_for_status()
        data = response.json()
        foods = []

        for food in data.get("foods", []):
            nutrients = []
            for nutrient in food.get("foodNutrients", []):
                value = nutrient.get("value")
                if value is None:
                    continue

                nutrients.append(
                    {
                        "name": nutrient.get("nutrientName"),
                        "number": str(
                            nutrient.get("nutrientNumber")
                            or nutrient.get("nutrientId")
                            or ""
                        ),
                        "unit": nutrient.get("unitName"),
                        "value": value,
                    }
                )

            foods.append(
                {
                    "id": f"usda_{food['fdcId']}",
                    "fdc_id": food["fdcId"],
                    "name": food.get("description", ""),
                    "brand": food.get("brandOwner", ""),
                    "barcode": food.get("gtinUpc", ""),
                    "description": food.get("dataType", ""),
                    "serving": 100,
                    "unit": "g",
                    "source": "usda",
                    "nutrients": nutrients,
                }
            )

        return foods

    def get_food(self, fdc_id):
        response = requests.get(
            f"{self.BASE_URL}/food/{fdc_id}",
            params={
                "api_key": self.api_key,
            },
            timeout=20,
        )

        response.raise_for_status()

        data = response.json()

        nutrients = []

        for nutrient in data.get("foodNutrients", []):
            info = nutrient.get("nutrient", {})
            amount = nutrient.get("amount")

            if amount is None:
                continue

            nutrients.append(
                {
                    "name": info.get("name"),
                    "number": info.get("id"),
                    "unit": info.get("unitName"),
                    "value": amount,
                }
            )

        return {
            "fdc_id": data["fdcId"],
            "name": data.get("description", ""),
            "brand": data.get("brandOwner", ""),
            "barcode": data.get("gtinUpc", ""),
            "description": data.get("dataType", ""),
            "serving": 100,
            "unit": "g",
            "source": "usda",
            "nutrients": nutrients,
        }
