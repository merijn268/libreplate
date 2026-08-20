import random
from decimal import Decimal

from apps.core.models import base as base_models
from apps.foods.models import Food
from apps.recipes.models import Recipe
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models

from .planned_meals import PlannedMealEntry


class FoodOrRecipeAmount(models.Model):
    """
    Abstract mixin for anything that references either a Food or a Recipe
    along with an amount to prepare/consume.

    Foods carry a serving_size (e.g. grams) and a number of servings;
    recipes are inherently portioned, so only number of servings applies.
    """

    food = models.ForeignKey(
        Food,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="+",
    )
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="+",
    )
    number_of_servings = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=Decimal("1.00"),
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    serving_size = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.01"))],
        help_text="Only applicable when the item is a food.",
    )

    class Meta:
        abstract = True

    def clean(self):
        super().clean()
        if bool(self.food_id) == bool(self.recipe_id):
            raise ValidationError(
                f"A {self._meta.verbose_name} must have either a food or a recipe."
            )
        if self.recipe_id and self.serving_size is not None:
            raise ValidationError(
                {"serving_size": "Serving size only applies to foods, not recipes."}
            )
        if self.food_id and self.serving_size is None:
            raise ValidationError(
                {"serving_size": "Serving size is required for foods."}
            )

    def get_item(self):
        return self.food or self.recipe

    def get_amount(self):
        """Return a normalized amount dict for whichever item is set."""
        if self.food_id:
            return {
                "serving_size": self.serving_size,
                "number_of_servings": self.number_of_servings,
            }
        return {"number_of_servings": self.number_of_servings}

    @classmethod
    def item_constraint(cls, name):
        return models.CheckConstraint(
            condition=(
                models.Q(food__isnull=False, recipe__isnull=True)
                | models.Q(food__isnull=True, recipe__isnull=False)
            ),
            name=name,
        )


class RandomizerItem(
    PlannedMealEntry,
    base_models.HasName,
):
    """
    A planned meal entry that randomly selects one Food or Recipe from a
    configured list of candidates.
    A persisted seed makes the selected candidate reproducible once the
    randomizer has been planned.
    """

    seed = models.PositiveBigIntegerField(
        null=True,
        blank=True,
    )
    candidates = models.ManyToManyField(
        "RandomizerCandidate",
        related_name="randomizer_items",
        blank=True,
    )

    def get_candidates(self):
        return list(self.candidates.select_related("food", "recipe"))

    def _pick_candidate(self, seed=None):
        candidates = self.get_candidates()
        if not candidates:
            return None
        rng = random.Random(seed)
        return rng.choice(candidates)

    def get_item(self, seed=None):
        """
        Return the Food or Recipe selected for the given seed, without
        its amount. Kept for backwards compatibility; prefer
        get_item_and_amount() if you also need the amount.
        """
        candidate = self._pick_candidate(seed=seed)
        return candidate.get_item() if candidate else None

    def get_item_and_amount(self, seed=None):
        """
        Return a (item, amount) tuple for the candidate selected by the
        given seed, where item is a Food or Recipe instance and amount is
        the dict produced by RandomizerCandidate.get_amount().
        """
        candidate = self._pick_candidate(seed=seed)
        if candidate is None:
            return None, None
        return candidate.get_item(), candidate.get_amount()

    def randomize(self):
        """
        Generate and persist a seed, then return the (item, amount)
        selected by that seed.
        """
        self.seed = random.SystemRandom().randrange(0, 2**63)
        self.save(update_fields=["seed"])
        return self.get_item_and_amount(seed=self.seed)


class RandomizerCandidate(FoodOrRecipeAmount):
    """
    A candidate Food or Recipe (with its amount) that can be selected by a
    RandomizerItem.
    """

    class Meta:
        constraints = [
            FoodOrRecipeAmount.item_constraint("randomizer_candidate_exactly_one_item"),
        ]
