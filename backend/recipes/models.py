from collections import defaultdict
from decimal import ROUND_HALF_UP, Decimal

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
from tags.models import BaseTag


class Recipe(models.Model):
    def get_nutrients(self, per_portion=True):
        totals = defaultdict(lambda: Decimal("0"))

        ingredients = self.ingredients.select_related("food").prefetch_related(
            "food__food_nutrients__nutrient"
        )

        for ingredient in ingredients:
            multiplier = Decimal(str(ingredient.serving_amount))

            for food_nutrient in ingredient.food.food_nutrients.all():
                nutrient_amount = Decimal(str(food_nutrient.amount))
                totals[food_nutrient.nutrient] += nutrient_amount * multiplier / 100

        if per_portion and self.portions:
            divisor = Decimal(str(self.portions))
            totals = {nutrient: amount / divisor for nutrient, amount in totals.items()}

        totals = {
            nutrient: amount.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
            for nutrient, amount in totals.items()
        }

        return totals

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="recipes")
    name = models.CharField(max_length=255)
    is_favorite = models.BooleanField(default=False)

    # TODO Remove pin feature.
    is_pinned = models.BooleanField(default=False)

    # TODO Remove summary, description is enough.
    summary = models.CharField(max_length=70, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    instructions = models.TextField(blank=True, null=True)
    cooking_time = models.CharField(max_length=20, blank=True, null=True)
    prepping_time = models.CharField(max_length=20, blank=True, null=True)

    portions = models.FloatField(
        default=1, help_text="Number of portions this recipe creates"
    )

    last_used_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    tags = models.ManyToManyField(
        "RecipeTag",
        related_name="recipes",
        blank=True,
    )

    def __str__(self):
        return self.name


class RecipePicture(models.Model):
    recipe = models.OneToOneField(
        Recipe,
        on_delete=models.CASCADE,
        related_name="picture",
    )
    image = models.ImageField(upload_to="recipes/")

    def __str__(self):
        return f"{self.recipe.name} picture"


class RecipeTag(BaseTag):
    class Meta(BaseTag.Meta):
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"],
                name="unique_user_recipe_tag",
            )
        ]


class RecipeIngredient(models.Model):
    recipe = models.ForeignKey(
        Recipe, on_delete=models.CASCADE, related_name="ingredients"
    )

    food = models.ForeignKey("foods.Food", on_delete=models.CASCADE)

    number_of_servings = models.FloatField(default=1)
    serving_amount = models.FloatField(default=1)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):

        return f"{self.food.name} in {self.recipe.name}"
