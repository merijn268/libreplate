# nutrients/models
from apps.core import models as core_models
from django.db import models

# TODO add way so user can make his own nutrients.


class Nutrient(
    core_models.HasName,
    core_models.HasDescription,
):
    abbreviation = models.CharField(max_length=100, blank=True, null=True)

    # TODO user unit model not chars!
    unit = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Display unit for this nutrient's amount (e.g. g, mg, kcal).",
    )

    show_in_diary_total = models.BooleanField(
        null=True,
        blank=True,
        help_text="Show this nutrient in diary totals.",
    )

    show_in_diary_meal = models.BooleanField(
        null=True,
        blank=True,
        help_text="Show this nutrient in individual diary meals.",
    )

    show_in_food_edit = models.BooleanField(
        null=True,
        blank=True,
        help_text="Show this nutrient when editing a food.",
    )

    show_in_recipe = models.BooleanField(
        null=True,
        blank=True,
        help_text="Show this nutrient a recipe.",
    )

    show_in_recipes = models.BooleanField(
        null=True,
        blank=True,
        help_text="Show this nutrient in recipes.",
    )

    show_in_foods = models.BooleanField(
        null=True,
        blank=True,
        help_text="Show this nutrient in food detail/list pages.",
    )

    show_in_goal_edit = models.BooleanField(
        null=True,
        blank=True,
    )

    # TODO make non specific later on. (external ID)
    usda_nutrient_number = models.IntegerField(
        blank=True,
        null=True,
        unique=True,
        help_text="USDA nutrient number (e.g. 1003 for Protein).",
    )

    order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Nutrients"
        ordering = ["order"]

    def __str__(self):
        return self.name
