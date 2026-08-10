import calendar

from apps.core import models as core_models
from apps.foods.models import Food
from apps.meals.models import DefaultMeal
from apps.recipes.models import Recipe
from apps.tags.models import BaseTag
from django.core.validators import MaxValueValidator
from django.db import models


class MealPlanTag(BaseTag):
    pass


class MealPlan(
    core_models.BelongsToUser,
    core_models.CanBeFavorited,
    core_models.HasDescription,
    core_models.HasName,
    core_models.HasTimestamps,
    core_models.TracksUsage,
):
    tags = models.ManyToManyField(
        MealPlanTag,
        blank=True,
        related_name="meal_plans",
    )

    start_day = models.PositiveSmallIntegerField(
        choices=[(day.value, day.name.title()) for day in calendar.Day],
        default=calendar.Day.MONDAY.value,
        validators=[MaxValueValidator(6)],
        help_text="Weekday number on which the meal plan starts (Monday=0)",
    )


class MealPlanEntry(models.Model):
    """
    Abstract base class for entries in a meal plan.
    """

    meal_plan = models.ForeignKey(MealPlan, on_delete=models.CASCADE)
    number_of_servings = models.FloatField(default=1)

    meal = models.ForeignKey(DefaultMeal, on_delete=models.CASCADE)
    day = models.PositiveSmallIntegerField(
        help_text=(
            "Day offset from the meal plan's start day. "
            "0 = start day, 1 = next day, etc."
        ),
    )

    class Meta:
        abstract = True

    def get_weekday(self) -> int:
        return (self.meal_plan.start_day + self.day) % 7

    def get_weekday_display(self) -> str:
        return calendar.day_name[self.get_weekday()]

    def get_item(self):
        raise NotImplementedError


class MealPlanFood(MealPlanEntry):
    meal_plan = models.ForeignKey(
        MealPlan,
        on_delete=models.CASCADE,
        related_name="foods",
    )

    meal = models.ForeignKey(
        DefaultMeal,
        on_delete=models.CASCADE,
        related_name="meal_plan_foods",
    )

    food = models.ForeignKey(
        "foods.Food",
        on_delete=models.CASCADE,
        related_name="meal_plan_entries",
    )

    serving_size = models.FloatField()

    def get_item(self) -> Food:
        return self.food


class MealPlanRecipe(MealPlanEntry):
    meal_plan = models.ForeignKey(
        MealPlan,
        on_delete=models.CASCADE,
        related_name="recipes",
    )

    meal = models.ForeignKey(
        DefaultMeal,
        on_delete=models.CASCADE,
        related_name="meal_plan_recipes",
    )

    recipe = models.ForeignKey(
        "recipes.Recipe",
        on_delete=models.CASCADE,
        related_name="meal_plan_entries",
    )

    serving_size = models.FloatField(default=100)

    def get_item(self) -> Recipe:
        return self.recipe
