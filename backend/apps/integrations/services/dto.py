from dataclasses import dataclass, field
from typing import Any


@dataclass
class IntegrationNutrient:
    """
    Mirrors foods.models.FoodNutrient's readable interface (`.nutrient`,
    `.amount`) so FoodNutrientSerializer can serialize it without changes.
    """

    nutrient: Any  # nutrients.models.Nutrient instance
    amount: float


@dataclass
class IntegrationFood:
    """
    Read-only representation of a food coming from an external integration
    (Dirk, USDA, ...) before it has been saved as a `foods.models.Food`.

    This intentionally exposes the same attribute names as `Food` (unit,
    is_favorite, tags, and a `food_nutrients` property in place of the
    reverse-FK manager) so that `FoodSerializer` can serialize a Food
    instance and an IntegrationFood instance identically, with no branching
    in the serializer itself.
    """

    name: str
    serving: float = 100
    unit: Any = None  # units.models.Unit instance, if one could be resolved

    barcode: str | None = None
    brand: str | None = None
    description: str | None = None
    is_favorite: bool = False

    external_source: str | None = None
    external_id: str | None = None

    tags: list = field(default_factory=list)
    nutrients: list["IntegrationNutrient"] = field(default_factory=list)

    id: None = None

    @property
    def food_nutrients(self):
        """
        Alias so FoodSerializer's `nutrients = FoodNutrientSerializer(
        source="food_nutrients", ...)` works unchanged for integration
        foods, exactly as it does for the Food model's reverse-FK manager.
        """
        return self.nutrients
