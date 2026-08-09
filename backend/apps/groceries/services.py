from collections import defaultdict

from apps.meals.models import MealFood


def generate_grocery_items(grocery_list):
    """
    Generate grocery items from diary meals.
    Shared logic.
    """

    meals = grocery_list.user.meals.filter(
        date__range=[grocery_list.date_start, grocery_list.date_end]
    )

    meal_foods = MealFood.objects.filter(meal__in=meals)

    food_totals = defaultdict(float)

    for item in meal_foods:
        amount = item.serving_size * item.number_of_servings

        food_totals[item.food_id] += amount

    from .models import GroceryListFood

    for food_id, amount in food_totals.items():
        GroceryListFood.objects.create(
            grocery_list=grocery_list, food_id=food_id, amount=amount
        )
