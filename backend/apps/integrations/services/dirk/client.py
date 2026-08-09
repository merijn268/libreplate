from __future__ import annotations

from decimal import Decimal
from typing import Any

import httpx
from django.core.cache import cache
from pydantic import BaseModel, ConfigDict, Field, field_validator


class DirkFoodNutrient(BaseModel):
    name: str
    unit: str
    amount: Decimal = Decimal("0")

    model_config = ConfigDict(
        populate_by_name=True,
    )

    @field_validator(
        "amount",
        mode="before",
    )
    @classmethod
    def parse_amount(cls, value):
        if value in (
            None,
            "",
        ):
            return Decimal("0")

        try:
            return Decimal(str(value))

        except Exception:
            return Decimal("0")


class DirkFood(BaseModel):
    name: str
    serving: float = 100
    unit_id: None = None
    unit: str = "g"
    barcode: str | None = None
    brand: str | None = None
    description: str | None = None
    external_source: str = "Dirk"
    external_id: str | None = None
    nutrients: list[DirkFoodNutrient] = Field(default_factory=list)

    model_config = ConfigDict(
        populate_by_name=True,
    )


class DirkClient:
    URL = "https://web-gateway.dirk.nl/graphql"

    def __init__(self):
        self.client = httpx.Client(
            headers={
                "Origin": "https://www.dirk.nl",
                "Referer": "https://www.dirk.nl/",
                "User-Agent": "Mozilla/5.0",
                "Content-Type": "application/json",
            }
        )

    def graphql(
        self,
        query: str,
        variables: dict[str, Any] | None = None,
    ):
        response = self.client.post(
            self.URL,
            json={
                "query": query,
                "variables": variables or {},
            },
        )

        response.raise_for_status()

        result = response.json()

        if "errors" in result:
            raise Exception(result["errors"])

        return result.get(
            "data",
            {},
        )

    def product(
        self,
        product_id: int,
    ):
        cache_key = f"dirk-product:{product_id}"

        cached_product = cache.get(cache_key)

        if cached_product is not None:
            return cached_product

        query = f"""
        query {{
            product(productId: {product_id}) {{

                productId
                headerText
                description

                brand

                barcode

                declarations {{
                    nutritionalInformation {{
                        nutritionalValues {{
                            text
                            value

                            nutritionalSubValues {{
                                text
                                value
                            }}
                        }}
                    }}
                }}
            }}
        }}
        """

        data = self.graphql(query)

        product = data.get("product") or {}

        cache.set(
            cache_key,
            product,
            timeout=60 * 60 * 24,
        )

        return product

    def search(
        self,
        term: str,
        limit: int = 20,
    ):
        query = """
        query {
            searchProducts(
                search: "%s",
                limit: %s
            ) {
                products {
                    product {
                        productId
                    }
                }
            }
        }
        """ % (
            term,
            limit,
        )

        data = self.graphql(query)

        return (data.get("searchProducts") or {}).get(
            "products",
            [],
        )

    def create_food(
        self,
        product: dict[str, Any],
    ) -> DirkFood:
        return DirkFood(
            name=product.get(
                "headerText",
                "",
            ),
            barcode=product.get(
                "barcode",
            ),
            brand=product.get(
                "brand",
            ),
            description=product.get(
                "description",
            ),
            external_id=str(
                product.get(
                    "productId",
                )
            ),
            nutrients=self.extract_nutrients(
                product,
            ),
        )

    def extract_nutrients(
        self,
        product: dict[str, Any],
    ) -> list[DirkFoodNutrient]:
        declarations = product.get("declarations") or {}

        nutritional_information = declarations.get("nutritionalInformation") or {}

        values = nutritional_information.get("nutritionalValues") or []

        nutrients = []

        for item in values:
            nutrient = self.create_nutrient(item)

            if nutrient:
                nutrients.append(nutrient)

            for sub_value in item.get("nutritionalSubValues") or []:
                nutrient = self.create_nutrient(sub_value)

                if nutrient:
                    nutrients.append(nutrient)

        return nutrients

    def create_nutrient(
        self,
        item: dict[str, Any],
    ):
        nutrient_map = {
            "Energie Kilocalorieën (kcal)": (
                "Energy",
                "kcal",
            ),
            "Vetten (g)": (
                "Fat",
                "g",
            ),
            "verzadigde vetzuren (g)": (
                "Saturated Fat",
                "g",
            ),
            "Koolhydraten (g)": (
                "Carbohydrates",
                "g",
            ),
            "suikers (g)": (
                "Sugar",
                "g",
            ),
            "Voedingsvezel (g)": (
                "Fiber",
                "g",
            ),
            "Eiwitten (g)": (
                "Protein",
                "g",
            ),
            "Zout (g)": (
                "Sodium",
                "g",
            ),
        }

        mapped = nutrient_map.get(item.get("text"))

        if not mapped:
            return None

        return DirkFoodNutrient(
            name=mapped[0],
            unit=mapped[1],
            amount=item.get(
                "value",
                0,
            ),
        )
