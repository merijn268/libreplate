from .models import DefaultMeal


def get_default_meals(user):
    return [
        DefaultMeal(
            user=user,
            name="Breakfast",
            order=1,
            description="",
        ),
        DefaultMeal(
            user=user,
            name="Lunch",
            order=2,
            description="",
        ),
        DefaultMeal(
            user=user,
            name="Snack",
            order=3,
            description="",
        ),
        DefaultMeal(
            user=user,
            name="Dinner",
            order=4,
            description="",
        ),
    ]
