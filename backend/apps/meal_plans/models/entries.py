from apps.foods.models import Food
from apps.recipes.models import Recipe
from django.core.validators import MinValueValidator
from django.db import models


class PlannedMealEntry(models.Model):
    """
    An item served as part of a planned meal.
    """

    planned_meal = models.ForeignKey(
        "meal_plans.PlannedMeal",
        on_delete=models.CASCADE,
        related_name="entries",
    )

    number_of_servings = models.FloatField(
        default=1,
        validators=[MinValueValidator(0)],
    )

    def get_item(self):
        raise NotImplementedError


class PlannedMealFood(PlannedMealEntry):
    food = models.ForeignKey(
        Food,
        on_delete=models.CASCADE,
        related_name="meal_plan_entries",
    )

    serving_size = models.FloatField(
        validators=[MinValueValidator(0)],
    )

    def get_item(self) -> Food:
        return self.food


class PlannedMealRecipe(PlannedMealEntry):
    """
    A recipe served as part of a planned meal.
    """

    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name="meal_plan_entries",
    )

    def get_item(self) -> Recipe:
        return self.recipe
