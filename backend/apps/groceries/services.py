from collections import defaultdict
from datetime import timedelta

from apps.groceries.models import GroceryList, GroceryListFood
from apps.meal_plans.models import (
    MealPlan,
    PlannedMealFood,
    PlannedMealRecipe,
)
from django.db import transaction
from django.utils import timezone


class GroceryListGenerator:
    MAX_LENGTH_DAYS = 31

    def __init__(self, meal_plan: MealPlan, length_days: int):
        self.meal_plan = meal_plan
        self.length_days = length_days
        self.start_date = timezone.localdate()
        self.end_date = self.start_date + timedelta(days=length_days - 1)

    @transaction.atomic
    def generate(self) -> GroceryList:
        self._validate()
        food_amounts = self._get_food_amounts()
        grocery_list = self._create_grocery_list()
        self._create_grocery_list_foods(
            grocery_list=grocery_list,
            food_amounts=food_amounts,
        )
        return grocery_list

    def _validate(self):
        if not 0 < self.length_days <= self.MAX_LENGTH_DAYS:
            raise ValueError(
                f"Generating a grocery list for more than {self.MAX_LENGTH_DAYS} days is not allowed."
            )

    def _get_food_amounts(self):
        """
        Calculate the total amount needed for every food during the
        requested period.
        """
        mealplan_duration = self.meal_plan.get_duration_days()

        planned_meals_by_day, recurring_entries = self._prepare_meal_plan_entries()

        food_amounts = defaultdict(float)

        for offset in range(self.length_days):
            absolute_day = self.meal_plan._get_absolute_day_for_offset(
                offset=offset,
                start_date=self.start_date,
                duration_days=mealplan_duration,
            )

            plan_day = absolute_day % mealplan_duration

            entries = self._get_entries_for_day(
                plan_day=plan_day,
                absolute_day=absolute_day,
                planned_meals_by_day=planned_meals_by_day,
                recurring_entries=recurring_entries,
            )

            self._add_entry_amounts(
                entries=entries,
                food_amounts=food_amounts,
            )

        return food_amounts

    def _prepare_meal_plan_entries(self):
        """
        Prepare the meal-plan entries once so we don't repeatedly query
        the database while iterating over the requested days.
        """
        planned_meals_by_day = defaultdict(list)
        recurring_entries = []

        for planned_meal in self.meal_plan.get_effective_planned_meals():
            entries = self._get_planned_meal_entries(planned_meal)

            planned_meals_by_day[planned_meal.day].extend(entries)

            for entry in entries:
                recurrence = self.meal_plan._get_entry_recurrence(entry)

                if recurrence is not None:
                    recurring_entries.append((planned_meal, entry, recurrence))

        return planned_meals_by_day, recurring_entries

    @staticmethod
    def _get_planned_meal_entries(planned_meal):
        return [
            *planned_meal.foods(),
            *planned_meal.recipes(),
        ]

    def _get_entries_for_day(
        self,
        plan_day,
        absolute_day,
        planned_meals_by_day,
        recurring_entries,
    ):
        entries = []

        # Entries anchored to this plan day.
        entries.extend(planned_meals_by_day.get(plan_day, []))

        # Entries that recur on this absolute day.
        for planned_meal, entry, recurrence in recurring_entries:
            if recurrence.occurs_on(
                origin_day=planned_meal.day,
                day=absolute_day,
                start_day=self.meal_plan.start_day,
            ):
                entries.append(entry)

        return entries

    def _add_entry_amounts(self, entries, food_amounts):
        for entry in entries:
            if isinstance(entry, PlannedMealFood):
                self._add_food_amount(
                    food_amounts=food_amounts,
                    food=entry.food,
                    amount=(entry.serving_size * entry.number_of_servings),
                )

            elif isinstance(entry, PlannedMealRecipe):
                self._add_recipe_amounts(
                    food_amounts=food_amounts,
                    entry=entry,
                )

    @staticmethod
    def _add_food_amount(food_amounts, food, amount):
        food_amounts[food.id] += amount

    def _add_recipe_amounts(
        self,
        food_amounts,
        entry: PlannedMealRecipe,
    ):
        recipe = entry.recipe

        portions = recipe.portions or 1
        recipe_scale = entry.number_of_servings / portions

        for ingredient in recipe.ingredients.select_related("food"):
            amount = (
                ingredient.serving_amount * ingredient.number_of_servings * recipe_scale
            )

            self._add_food_amount(
                food_amounts=food_amounts,
                food=ingredient.food,
                amount=amount,
            )

    def _create_grocery_list(self):
        return GroceryList.objects.create(
            user=self.meal_plan.user,
            name=f"Grocery list {self.start_date} to {self.end_date}",
            date_start=self.start_date,
            date_end=self.end_date,
        )

    @staticmethod
    def _create_grocery_list_foods(
        grocery_list,
        food_amounts,
    ):
        GroceryListFood.objects.bulk_create(
            [
                GroceryListFood(
                    grocery_list=grocery_list,
                    food_id=food_id,
                    amount=amount,
                )
                for food_id, amount in food_amounts.items()
                if amount != 0
            ]
        )
