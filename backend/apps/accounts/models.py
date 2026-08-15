from colorfield.fields import ColorField
from django.conf import settings
from django.db import models


class UserPreferences(models.Model):
    SORT_CHOICES = [
        ("name", "Name"),
        ("-created_at", "Newest"),
        ("created_at", "Oldest"),
    ]

    def update_recipe_sort(self, recipe_sort):
        valid_sorts = {
            choice[0] for choice in self._meta.get_field("recipe_sort").choices
        }

        if recipe_sort not in valid_sorts:
            return

        if recipe_sort != self.recipe_sort:
            self.recipe_sort = recipe_sort
            self.save(update_fields=["recipe_sort"])

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="preferences"
    )

    food_sort_mode = models.CharField(
        max_length=50, choices=SORT_CHOICES, default="-created_at"
    )

    dark_mode = models.BooleanField(default=False)
    theme_color = ColorField(default="#107800")

    # TODO setting allow multiple meal plans at once
    # TODO setting macro colors
    # TODO setting more contract colors

    RECIPE_SORT_CHOICES = [
        ("last_used", "Last used"),
        ("created", "Last created"),
        ("updated", "Last updated"),
        ("name", "Name"),
    ]

    recipe_sort = models.CharField(
        max_length=20,
        choices=RECIPE_SORT_CHOICES,
        default="last_used",
    )

    def __str__(self):
        return f"{self.user.username}'s preferences"
