from __future__ import annotations

from decimal import Decimal
from functools import lru_cache
from typing import Any, Literal

import requests
from apps.integrations.models import USDAAPISettings
from pydantic import (
    AliasChoices,
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

USDA_API_BASE_URL = "https://api.nal.usda.gov/fdc/v1"

MIN_PAGE_SIZE = 1
MAX_PAGE_SIZE = 50
MIN_PAGE_NUMBER = 1
MAX_PAGE_NUMBER = 1000


USDADataType = Literal[
    "Branded",
    "Foundation",
    "SR Legacy",
    "Survey (FNDDS)",
    "Experimental",
]


DEFAULT_NON_BRANDED_DATA_TYPES: tuple[USDADataType, ...] = (
    "Foundation",
    "SR Legacy",
    "Survey (FNDDS)",
    "Experimental",
)


class USDAError(Exception):
    pass


class USDAFoodNutrient(BaseModel):
    id: int = Field(
        alias="nutrientId",
    )

    number: Decimal | None = Field(
        default=None,
        alias="nutrientNumber",
    )

    name: str = Field(
        alias="nutrientName",
    )

    unit_name: str = Field(
        alias="unitName",
    )

    value: Decimal = Decimal("0")

    model_config = ConfigDict(
        populate_by_name=True,
    )

    @model_validator(mode="before")
    @classmethod
    def flatten_nested_nutrient(
        cls,
        data,
    ):
        if not isinstance(data, dict):
            return data

        data = dict(data)

        nested = data.get(
            "nutrient",
        )

        if isinstance(nested, dict):
            data.setdefault(
                "nutrientId",
                nested.get("id"),
            )

            data.setdefault(
                "nutrientNumber",
                nested.get("number"),
            )

            data.setdefault(
                "nutrientName",
                nested.get("name"),
            )

            data.setdefault(
                "unitName",
                nested.get("unitName"),
            )

        if "amount" in data and "value" not in data:
            data["value"] = data["amount"]

        return data

    @field_validator(
        "number",
        mode="before",
    )
    @classmethod
    def empty_string_to_none(
        cls,
        value,
    ):
        if value == "":
            return None

        return value

    @field_validator(
        "value",
        mode="before",
    )
    @classmethod
    def coerce_value(
        cls,
        value,
    ):
        if value in (
            None,
            "",
        ):
            return Decimal("0")

        try:
            return Decimal(str(value))

        except Exception:
            return Decimal("0")


class USDAFood(BaseModel):
    name: str = Field(
        alias="description",
    )

    serving: float = 100

    unit_name: str = "g"

    brand: str | None = Field(
        None,
        validation_alias="brandName",
    )

    description: str | None = None

    fdc_id: int | None = Field(
        None,
        validation_alias=AliasChoices(
            "fdc_id",
            "fdcId",
        ),
    )

    data_type: str | None = Field(
        None,
        validation_alias=AliasChoices(
            "data_type",
            "dataType",
        ),
    )

    food_nutrients: list[USDAFoodNutrient] = Field(
        default_factory=list,
        alias="foodNutrients",
    )

    model_config = ConfigDict(
        populate_by_name=True,
    )

    @field_validator(
        "food_nutrients",
        mode="before",
    )
    @classmethod
    def drop_invalid_nutrients(
        cls,
        value,
    ):
        if not isinstance(value, list):
            return value

        valid = []

        for item in value:
            try:
                valid.append(USDAFoodNutrient.model_validate(item))

            except Exception:
                continue

        return valid


class USDAClient:
    def __init__(self):
        pass

    def get_api_key(self):

        try:
            return USDAAPISettings.objects.get().key

        except USDAAPISettings.DoesNotExist as exc:
            raise USDAError("USDA API key is not configured.") from exc

    def request(
        self,
        endpoint: str,
        *,
        params: dict[str, Any] | None = None,
    ):

        response = requests.get(
            f"{USDA_API_BASE_URL}/{endpoint}",
            params={
                **(params or {}),
                "api_key": self.get_api_key(),
            },
            timeout=10,
        )

        if response.status_code == 404:
            raise USDAError("Food not found.")

        if not response.ok:
            raise USDAError(f"USDA API error: {response.status_code} {response.text}")

        return response.json()

    @lru_cache(maxsize=128)
    def search_foods(
        self,
        term: str,
        *,
        page_size: int = 25,
        page_number: int = 1,
        data_type: tuple[USDADataType, ...] = DEFAULT_NON_BRANDED_DATA_TYPES,
    ):

        return self.request(
            "foods/search",
            params={
                "generalSearchInput": term,
                "pageSize": page_size,
                "pageNumber": page_number,
                "dataType": ",".join(data_type),
            },
        )

    @lru_cache(maxsize=128)
    def get_food(
        self,
        fdc_id: int,
    ):

        return self.request(f"food/{fdc_id}")

    def extract_brand(
        self,
        food,
    ):

        return food.get("brandOwner") or food.get("brandName")

    def create_usda_food(
        self,
        food_data,
    ):

        data = food_data.copy()

        data.update(
            name=food_data.get(
                "description",
            ),
            brand=self.extract_brand(food_data),
            description=(food_data.get("ingredients") or food_data.get("description")),
        )

        return USDAFood(**data)

    def validate_pagination(
        self,
        page_size,
        page_number,
    ):

        if not MIN_PAGE_SIZE <= page_size <= MAX_PAGE_SIZE:
            raise USDAError(
                f"page_size must be between {MIN_PAGE_SIZE} and {MAX_PAGE_SIZE}"
            )

        if not MIN_PAGE_NUMBER <= page_number <= MAX_PAGE_NUMBER:
            raise USDAError(
                f"page_number must be between {MIN_PAGE_NUMBER} and {MAX_PAGE_NUMBER}"
            )

    def search(
        self,
        term: str,
        *,
        page_size: int = 25,
        page_number: int = 1,
        data_type: tuple[USDADataType, ...] = DEFAULT_NON_BRANDED_DATA_TYPES,
    ):

        self.validate_pagination(
            page_size,
            page_number,
        )

        response = self.search_foods(
            term,
            page_size=page_size,
            page_number=page_number,
            data_type=data_type,
        )

        return [
            self.create_usda_food(food)
            for food in response.get(
                "foods",
                [],
            )
        ]


usda_client = USDAClient()
