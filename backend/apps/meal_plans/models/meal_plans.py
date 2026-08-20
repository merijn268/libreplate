import calendar
from collections import defaultdict
from datetime import timedelta
from decimal import Decimal

from apps.core.models import base as base_models
from apps.meals.models import DefaultMeal, Meal, MealFood
from apps.tags.models import BaseTag
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models, transaction


class MealPlanTag(BaseTag):
    pass


class MealPlanPeriodUnit(models.TextChoices):
    DAY = "day", "Day"
    WEEK = "week", "Week"


class MealPlan(
    base_models.BelongsToUser,
    base_models.CanBeFavorited,
    base_models.HasDescription,
    base_models.HasName,
    base_models.HasTimestamps,
    base_models.TracksUsage,
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

    @classmethod
    def get_active_instance(cls, user):
        return cls.objects.filter(user=user, is_active=True).first()

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
        from .planned_meals import PlannedMeal  # local import avoids circular import

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

    def _get_absolute_day_for_offset(self, offset, start_date, duration_days):
        """
        Map an `apply()` offset (days since `start_date`) to a
        continuously increasing "absolute" plan-day index - i.e. how
        many days after the plan's own day 0 (`self.start_day`) the
        target date falls, *without* wrapping by `duration_days`.

        This absolute index is what both plan-day matching
        (`% duration_days`, see `apply()`) and entry recurrence
        (`PlannedMealEntryRecurrence.occurs_on`) are measured against,
        so a plan that repeats (wraps) and an entry that recurs across
        those repeats stay consistent with each other - e.g. an entry
        that repeats "every 2 weeks" keeps counting weeks correctly
        even once the underlying plan has looped back to day 0.

        Weekday alignment only makes sense when the plan repeats on a
        7-day cycle (`duration_days % 7 == 0` - true for WEEK-period
        plans, and DAY-period plans whose duration is a multiple of 7).
        For any other DAY-period duration, we fall back to `start_date`
        itself being absolute day 0.
        """
        if duration_days % 7 == 0:
            return offset + ((start_date.weekday() - self.start_day) % 7)

        return offset

    @staticmethod
    def _get_entry_recurrence(entry):
        """
        Safely fetch the (optional) PlannedMealEntryRecurrence attached
        to a PlannedMealFood/PlannedMealRecipe, or None if it has none.
        `entry.recurrence` is a reverse OneToOneField accessor, which
        raises DoesNotExist rather than returning None when absent.
        """
        from .recurrence import (
            PlannedMealEntryRecurrence,  # local import avoids circular import
        )

        try:
            return entry.recurrence
        except PlannedMealEntryRecurrence.DoesNotExist:
            return None

    @transaction.atomic
    def apply(self, start_date, days=MAX_APPLY_DAYS):
        """
        Apply this meal plan onto real Meal slots for `days` consecutive
        calendar dates, starting at `start_date`.

        Plan days are aligned by weekday against `self.start_day` (see
        `_get_absolute_day_for_offset`), so a planned meal on the plan's
        Monday only ever lands on an actual Monday `Meal`, no matter what
        calendar date `start_date` happens to be. If `days` is greater
        than the plan's own duration, the plan's days repeat (the
        plan-day index wraps with `% duration_days`).

        Beyond each entry's own planned day, any food or recipe entry
        with a PlannedMealEntryRecurrence is also applied on every date
        (within the `days` window) that its recurrence produces an
        occurrence for - see `PlannedMealEntryRecurrence.occurs_on`. A
        recurring entry is merged into the same Meal as any "anchor"
        entries already scheduled for that date/name, so a date can end
        up populated purely from recurrence even if no PlannedMeal is
        anchored there.

        For every (date, meal name) with at least one applicable entry:
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

        planned_meals = self.get_effective_planned_meals()

        planned_meals_by_day = defaultdict(list)
        entries_by_planned_meal = {}
        recurring_entries = []  # list of (planned_meal, entry, recurrence)

        for planned_meal in planned_meals:
            planned_meals_by_day[planned_meal.day].append(planned_meal)

            entries = list(planned_meal.foods()) + list(planned_meal.recipes())
            entries_by_planned_meal[id(planned_meal)] = entries

            for entry in entries:
                recurrence = self._get_entry_recurrence(entry)
                if recurrence is not None:
                    recurring_entries.append((planned_meal, entry, recurrence))

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
            absolute_day = self._get_absolute_day_for_offset(
                offset, start_date, duration_days
            )
            plan_day = absolute_day % duration_days

            entries_by_name = defaultdict(list)
            source_planned_meal_by_name = {}

            # Anchor entries: planned meals actually scheduled on this
            # plan day.
            for planned_meal in planned_meals_by_day.get(plan_day, []):
                entries_by_name[planned_meal.name].extend(
                    entries_by_planned_meal[id(planned_meal)]
                )
                source_planned_meal_by_name[planned_meal.name] = planned_meal

            # Recurring entries: individual foods/recipes whose
            # recurrence produces an extra occurrence on this date,
            # regardless of which day their PlannedMeal itself lives on.
            for planned_meal, entry, recurrence in recurring_entries:
                if not recurrence.occurs_on(
                    planned_meal.day, absolute_day, self.start_day
                ):
                    continue

                entries_by_name[planned_meal.name].append(entry)
                source_planned_meal_by_name.setdefault(planned_meal.name, planned_meal)

            for name, entries in entries_by_name.items():
                self._apply_entries_to_date(
                    name=name,
                    order=source_planned_meal_by_name[name].order,
                    entries=entries,
                    target_date=target_date,
                    default_meals_by_name=default_meals_by_name,
                    summary=summary,
                )

        return summary

    def _apply_entries_to_date(
        self, name, order, entries, target_date, default_meals_by_name, summary
    ):
        from .planned_meals import (
            PlannedMealFood,  # local import avoids circular import
        )

        meal = Meal.objects.filter(
            user=self.user,
            date=target_date,
            name=name,
        ).first()

        created = False

        if meal is None:
            meal = Meal.objects.create(
                user=self.user,
                date=target_date,
                name=name,
                order=order,
                default_meal=default_meals_by_name.get(name),
            )
            created = True

        if not created and meal.meal_foods.exists():
            summary["skipped_not_empty"].append(
                {"date": target_date, "meal_id": meal.id, "name": meal.name}
            )
            return

        meal_foods = []

        for entry in entries:
            if isinstance(entry, PlannedMealFood):
                meal_foods.append(
                    MealFood(
                        meal=meal,
                        food=entry.food,
                        serving_size=entry.serving_size,
                        number_of_servings=entry.number_of_servings,
                    )
                )
            else:
                meal_foods.extend(self._unfold_recipe(entry, meal))

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
