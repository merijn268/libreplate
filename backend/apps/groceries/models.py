from apps.core import models as core_models
from apps.foods.models import Food
from django.db import models


class GroceryList(
    core_models.BelongsToUser,
    core_models.CanBeFavorited,
    core_models.HasDescription,
    core_models.HasName,
    core_models.HasTimestamps,
    core_models.TracksUsage,
):
    date_start = models.DateField(null=True, blank=True)
    date_end = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class GroceryListFood(
    core_models.HasTimestamps,
):
    grocery_list = models.ForeignKey(
        GroceryList, on_delete=models.CASCADE, related_name="items"
    )

    food = models.ForeignKey(Food, on_delete=models.CASCADE)
    amount = models.FloatField()
    on_hand = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    last_modified_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.food.name
