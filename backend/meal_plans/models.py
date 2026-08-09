import calendar

from django.conf import settings
from django.core.validators import MaxValueValidator
from django.db import models
from meals.models import DefaultMeal


class MealPlan(models.Model):
    name = models.CharField(max_length=255, default="New Meal Plan")
    description = models.TextField(blank=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="meal_plans",
    )

    start_day = models.PositiveSmallIntegerField(
        choices=[(day.value, day.name.title()) for day in calendar.Day],
        default=calendar.Day.MONDAY.value,
        validators=[MaxValueValidator(6)],
        help_text="Weekday on which the meal plan starts.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Meal Plan"
        verbose_name_plural = "Meal Plans"

    def __str__(self):
        return self.name


class MealPlanEntry(models.Model):
    """
    Abstract base class for entries in a meal plan.
    """

    meal_plan = models.ForeignKey(
        MealPlan,
        on_delete=models.CASCADE,
    )

    meal = models.ForeignKey(
        DefaultMeal,
        on_delete=models.CASCADE,
    )

    day = models.PositiveSmallIntegerField(
        help_text=(
            "Day offset from the meal plan's start day. "
            "0 = start day, 1 = next day, etc."
        ),
    )

    serving_size = models.FloatField()
    number_of_servings = models.FloatField(default=1)

    class Meta:
        abstract = True

    def get_weekday(self) -> int:
        return (self.meal_plan.start_day + self.day) % 7

    def get_weekday_display(self) -> str:
        return calendar.day_name[self.get_weekday()]

    def get_item_name(self) -> str:
        raise NotImplementedError

    def __str__(self):
        return (
            f"{self.get_item_name()} - {self.get_weekday_display()} - {self.meal.name}"
        )


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

    def get_item_name(self) -> str:
        return self.food.name


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

    def get_item_name(self) -> str:
        return self.recipe.name
