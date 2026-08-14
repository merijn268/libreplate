import calendar

from apps.core import models as core_models
from apps.foods.models import Food
from apps.recipes.models import Recipe
from apps.tags.models import BaseTag
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models, transaction


class MealPlanTag(BaseTag):
    pass


class MealPlanPeriodUnit(models.TextChoices):
    DAY = "day", "Day"
    WEEK = "week", "Week"


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

    is_active = models.BooleanField(default=False)

    start_day = models.PositiveSmallIntegerField(
        default=calendar.Day.MONDAY.value,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(6),
        ],
        help_text="Weekday number on which the meal plan starts (Monday=0).",
    )

    duration = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Length of the meal plan.",
    )

    duration_period = models.CharField(
        max_length=4,
        choices=MealPlanPeriodUnit.choices,
        default=MealPlanPeriodUnit.WEEK,
        help_text="Period used for the meal plan duration.",
    )

    def get_duration_days(self) -> int:
        if self.duration_period == MealPlanPeriodUnit.WEEK:
            return self.duration * 7

        return self.duration

    @transaction.atomic
    def activate(self):
        type(self).objects.filter(user=self.user, is_active=True).exclude(
            pk=self.pk
        ).update(is_active=False)
        self.is_active = True
        self.save(update_fields=["is_active"])

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user"],
                condition=models.Q(is_active=True),
                name="unique_active_meal_plan_per_user",
            ),
        ]


class PlannedMeal(core_models.HasName):
    """
    A meal scheduled within a meal plan.
    """

    meal_plan = models.ForeignKey(
        MealPlan,
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


class PlannedMealEntryRecurrence(models.Model):
    """
    Defines how a planned meal entry repeats.

    A recurrence is expressed relative to the planned meal's day.
    """

    class End(models.TextChoices):
        NEVER = "never", "Never"
        ON_DAY = "on_day", "On day"
        AFTER = "after", "After"

    planned_meal_entry = models.OneToOneField(
        PlannedMealEntry,
        on_delete=models.CASCADE,
        related_name="recurrence",
    )

    interval_count = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text=(
            "Number of intervals between repetitions. "
            "For example, 2 with interval 'week' means every 2 weeks."
        ),
    )

    interval = models.CharField(
        max_length=10,
        choices=MealPlanPeriodUnit.choices,
        default=MealPlanPeriodUnit.WEEK,
        help_text="Unit used by interval_count.",
    )

    weekdays = models.JSONField(
        default=list,
        blank=True,
        help_text=(
            "List of weekday numbers on which the entry repeats when "
            "interval is 'week'. Values must be integers from 0 to 6, "
            "where Monday=0 and Sunday=6. For example, [0, 2, 4] "
            "means Monday, Wednesday, and Friday."
        ),
    )

    end = models.CharField(
        max_length=10,
        choices=End.choices,
        default=End.NEVER,
        help_text="Condition that determines when repetition ends.",
    )

    end_day = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text=(
            "Day offset from the meal plan's start day on which repetition ends."
        ),
    )

    end_after = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text=("Number of occurrences after which repetition ends."),
    )


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
