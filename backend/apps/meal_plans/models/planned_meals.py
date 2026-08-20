import calendar

from apps.core.models import base as base_models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models

from .entries import PlannedMealFood, PlannedMealRecipe


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
        """
        if self.pk is None:
            return PlannedMealFood.objects.none()

        return PlannedMealFood.objects.filter(
            planned_meal_id=self.pk,
        ).select_related(
            "food",
            "food__unit",
            "recurrence",
        )

    def recipes(self):
        """
        Return the recipe entries belonging to this planned meal.
        """
        if self.pk is None:
            return PlannedMealRecipe.objects.none()

        return PlannedMealRecipe.objects.filter(
            planned_meal_id=self.pk,
        ).select_related(
            "recipe",
            "recurrence",
        )
