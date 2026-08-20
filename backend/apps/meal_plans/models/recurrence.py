from django.core.validators import MinValueValidator
from django.db import models

from .meal_plans import MealPlanPeriodUnit


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
        "meal_plans.PlannedMealEntry",
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
        help_text="Number of occurrences after which repetition ends.",
    )

    def _matches_pattern(
        self,
        origin_day: int,
        day: int,
        start_day: int,
    ) -> bool:
        """
        Whether `day` (an absolute, non-wrapped plan-day index) matches
        this recurrence's interval/weekday pattern, ignoring any `end`
        condition.

        `origin_day` is the entry's own PlannedMeal.day — its first,
        anchor occurrence.
        """
        diff = day - origin_day

        if diff <= 0:
            return False

        if self.interval_count <= 0:
            return False

        if self.interval == MealPlanPeriodUnit.DAY:
            return diff % self.interval_count == 0

        # WEEK: only fires on the configured weekdays, every
        # `interval_count` weeks (counted in plan-day weeks, i.e.
        # 7-day blocks starting at the plan's own day 0).
        if not self.weekdays:
            return False

        weekday = (start_day + day) % 7

        if weekday not in self.weekdays:
            return False

        week_diff = (day // 7) - (origin_day // 7)

        return week_diff % self.interval_count == 0

    def _occurrence_number(
        self,
        origin_day: int,
        day: int,
        start_day: int,
    ) -> int:
        """
        Which occurrence `day` is, counting the origin day itself as
        occurrence 1.

        Used only to evaluate `end == AFTER`. Only ever called on days
        that already matched `_matches_pattern`, over the small
        (<= MealPlan.MAX_APPLY_DAYS + 6) window `apply()` works with,
        so a simple day-by-day scan is cheap.
        """
        count = 1  # The origin occurrence itself.

        for candidate in range(origin_day + 1, day + 1):
            if self._matches_pattern(origin_day, candidate, start_day):
                count += 1

        return count

    def occurs_on(
        self,
        origin_day: int,
        day: int,
        start_day: int,
    ) -> bool:
        """
        Whether this recurrence produces an occurrence of its entry on
        `day` (an absolute, non-wrapped plan-day index).

        `origin_day` is the entry's PlannedMeal.day, and `start_day` is
        the owning MealPlan's start_day, used to translate plan-day
        indices into weekdays for WEEK-interval recurrences.

        The origin day itself is always applied directly by
        `MealPlan.apply()`'s normal plan-day matching, so this only
        needs to answer for days after the origin.
        """
        if not self._matches_pattern(origin_day, day, start_day):
            return False

        if self.end == self.End.ON_DAY:
            return self.end_day is None or day <= self.end_day

        if self.end == self.End.AFTER:
            if self.end_after is None:
                return True

            return (
                self._occurrence_number(
                    origin_day,
                    day,
                    start_day,
                )
                <= self.end_after
            )

        return True
