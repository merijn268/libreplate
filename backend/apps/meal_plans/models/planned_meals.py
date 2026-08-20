import calendar

from apps.core.models import base as base_models
from apps.foods.models import Food
from apps.recipes.models import Recipe
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models


class PlannedMeal(base_models.HasName):
    """
    A meal scheduled within a meal plan.
    """

    meal_plan = models.ForeignKey(
        "meal_plans.MealPlan",
        on_delete=models.CASCADE,
        related_name="planned_meals",
    )

    day = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0)],
        help_text=(
            "Day offset from the meal plan's start day. "
            "0 = start day, 1 = next day, etc."
        ),
    )

    order = models.PositiveIntegerField(
        default=0,
        help_text="Display order of the meal within the day.",
    )

    def clean(self):
        super().clean()

        if self.meal_plan_id and self.day >= self.meal_plan.get_duration_days():
            raise ValidationError(
                {"day": ("Day offset must be less than the meal plan duration.")}
            )

    def get_weekday(self) -> int:
        return (self.meal_plan.start_day + self.day) % 7

    def get_weekday_display(self) -> str:
        return calendar.day_name[self.get_weekday()]

    def foods(self):
        """
        Return the food entries belonging to this planned meal.

        PlannedMealFood is a subclass of PlannedMealEntry (multi-table
        inheritance), so the FK back to PlannedMeal only exists once, on
        PlannedMealEntry, as `related_name="entries"`. There is no
        `planned_meal.foods` relation to read directly, so this queries
        PlannedMealFood explicitly instead. Named to match the "foods"
        field on PlannedMealSerializer: DRF calls zero-argument callables
        automatically when resolving a field's value.
        """
        if self.pk is None:
            return PlannedMealFood.objects.none()

        return PlannedMealFood.objects.filter(
            planned_meal_id=self.pk,
        ).select_related("food", "food__unit", "recurrence")

    def recipes(self):
        """Return the recipe entries belonging to this planned meal. See foods()."""
        if self.pk is None:
            return PlannedMealRecipe.objects.none()

        return PlannedMealRecipe.objects.filter(
            planned_meal_id=self.pk,
        ).select_related("recipe", "recurrence")


class PlannedMealEntry(models.Model):
    """
    An item served as part of a planned meal.
    """

    planned_meal = models.ForeignKey(
        PlannedMeal,
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
