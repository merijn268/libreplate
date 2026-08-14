import calendar
from collections import defaultdict
from datetime import timedelta
from decimal import Decimal

from apps.core import models as core_models
from apps.foods.models import Food
from apps.meals.models import DefaultMeal, Meal, MealFood
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
    # Hard cap on how many real days `apply()` can populate in one call.
    MAX_APPLY_DAYS = 7

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

    @transaction.atomic
    def deactivate(self):
        self.is_active = False
        self.save(update_fields=["is_active"])

    def get_effective_planned_meals(self):
        """
        Return persisted PlannedMeals for this plan, plus "virtual"
        PlannedMeals generated from the user's DefaultMeals for any
        (day, name) slot that isn't already covered by a real one.

        Virtual meals are never saved to the database and have id=None.
        Used both by MealPlanSerializer (to show them to the user) and
        by apply() (to know what to copy onto real Meals).
        """
        planned_meals = list(self.planned_meals.all())

        default_meals = list(
            DefaultMeal.objects.filter(user=self.user).order_by("order", "id")
        )

        if not default_meals:
            return planned_meals

        existing = {
            (planned_meal.day, planned_meal.name) for planned_meal in planned_meals
        }

        duration_days = self.get_duration_days()

        for day in range(duration_days):
            for default_meal in default_meals:
                key = (day, default_meal.name)

                if key in existing:
                    continue

                planned_meals.append(
                    PlannedMeal(
                        meal_plan=self,
                        day=day,
                        name=default_meal.name,
                        order=default_meal.order,
                    )
                )
                existing.add(key)

        return planned_meals

    @transaction.atomic
    def apply(self, start_date, days=MAX_APPLY_DAYS):
        """
        Apply this meal plan onto real Meal slots for `days` consecutive
        calendar dates, starting at `start_date`.

        `start_date` is treated as meal-plan day 0, `start_date + 1` as
        meal-plan day 1, and so on. If `days` is greater than the plan's
        own duration, the plan's days repeat (the meal-plan day index
        wraps with `% duration_days`).

        For every (date, planned meal) pair:
        - if no Meal exists yet for that user/date/name, one is created
          and populated;
        - if a Meal already exists but has no food entries, it's
          populated;
        - if a Meal already has food entries, it's left untouched.

        Recipe entries are "unfolded" into their ingredients as MealFood
        rows, since Meal/MealFood doesn't support recipes directly.

        Returns a summary dict with "populated", "skipped_not_empty",
        and "skipped_empty_plan" lists.
        """
        if not (1 <= days <= self.MAX_APPLY_DAYS):
            raise ValueError(f"days must be between 1 and {self.MAX_APPLY_DAYS}.")

        duration_days = self.get_duration_days()

        planned_meals_by_day = defaultdict(list)
        for planned_meal in self.get_effective_planned_meals():
            planned_meals_by_day[planned_meal.day].append(planned_meal)

        default_meals_by_name = {
            default_meal.name: default_meal
            for default_meal in DefaultMeal.objects.filter(user=self.user)
        }

        summary = {
            "populated": [],
            "skipped_not_empty": [],
            "skipped_empty_plan": [],
        }

        for offset in range(days):
            target_date = start_date + timedelta(days=offset)
            plan_day = offset % duration_days

            for planned_meal in planned_meals_by_day.get(plan_day, []):
                self._apply_planned_meal_to_date(
                    planned_meal=planned_meal,
                    target_date=target_date,
                    default_meals_by_name=default_meals_by_name,
                    summary=summary,
                )

        return summary

    def _apply_planned_meal_to_date(
        self, planned_meal, target_date, default_meals_by_name, summary
    ):
        meal = Meal.objects.filter(
            user=self.user,
            date=target_date,
            name=planned_meal.name,
        ).first()

        created = False

        if meal is None:
            meal = Meal.objects.create(
                user=self.user,
                date=target_date,
                name=planned_meal.name,
                order=planned_meal.order,
                default_meal=default_meals_by_name.get(planned_meal.name),
            )
            created = True

        if not created and meal.meal_foods.exists():
            summary["skipped_not_empty"].append(
                {"date": target_date, "meal_id": meal.id, "name": meal.name}
            )
            return

        meal_foods = [
            MealFood(
                meal=meal,
                food=planned_food.food,
                serving_size=planned_food.serving_size,
                number_of_servings=planned_food.number_of_servings,
            )
            for planned_food in planned_meal.foods()
        ]

        for planned_recipe in planned_meal.recipes():
            meal_foods.extend(self._unfold_recipe(planned_recipe, meal))

        if not meal_foods:
            summary["skipped_empty_plan"].append(
                {"date": target_date, "meal_id": meal.id, "name": meal.name}
            )
            return

        MealFood.objects.bulk_create(meal_foods)

        summary["populated"].append(
            {
                "date": target_date,
                "meal_id": meal.id,
                "name": meal.name,
                "foods_added": len(meal_foods),
            }
        )

    def _unfold_recipe(self, planned_recipe, meal):
        """
        Convert a PlannedMealRecipe into a list of unsaved MealFood
        instances, one per RecipeIngredient - Meal/MealFood doesn't
        support recipes directly, so recipes get "unfolded" into their
        constituent foods.

        Each ingredient's number_of_servings is scaled by
        (planned_recipe.number_of_servings / recipe.portions) - i.e. how
        many of the recipe's portions were planned, relative to how many
        portions the whole recipe makes. serving_size (the ingredient's
        serving_amount) carries over unchanged.
        """
        recipe = planned_recipe.recipe
        portions = Decimal(str(recipe.portions or 1))
        scale = Decimal(str(planned_recipe.number_of_servings)) / portions

        return [
            MealFood(
                meal=meal,
                food=ingredient.food,
                serving_size=ingredient.serving_amount,
                number_of_servings=float(
                    Decimal(str(ingredient.number_of_servings)) * scale
                ),
            )
            for ingredient in recipe.ingredients.select_related("food")
        ]

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
