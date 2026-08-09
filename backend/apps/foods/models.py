from apps.core.models import (
    BelongsToUser,
    CanBeFavorited,
    HasDescription,
    HasName,
    HasTimestamps,
    TracksUsage,
)
from apps.tags.models import BaseTag
from django.db import models


class Food(
    HasName,
    BelongsToUser,
    HasDescription,
    HasTimestamps,
    CanBeFavorited,
    TracksUsage,
):
    # TODO: Add public ID for serializing.
    # TODO: Enforce no negative numbers. Can be 0.
    serving = models.FloatField()

    unit = models.ForeignKey(
        "units.Unit",
        on_delete=models.CASCADE,
    )

    barcode = models.CharField(
        max_length=50,
        blank=True,
        null=True,
    )

    brand = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    tags = models.ManyToManyField(
        "FoodTag",
        related_name="foods",
        blank=True,
    )

    external_source = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        db_index=True,
    )

    external_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        db_index=True,
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Foods"
        indexes = [
            models.Index(fields=["barcode"]),
            models.Index(fields=["user", "brand"]),
        ]

    def __str__(self):
        return self.name

    def get_thumbnail_url(self):
        return None


# TODO hide constrains in base class
class FoodTag(BaseTag):
    class Meta(BaseTag.Meta):
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"],
                name="unique_user_food_tag",
            ),
        ]


class FoodNutrient(models.Model):
    food = models.ForeignKey(
        Food,
        on_delete=models.CASCADE,
        related_name="food_nutrients",
    )

    nutrient = models.ForeignKey(
        "nutrients.Nutrient",
        on_delete=models.CASCADE,
    )

    amount = models.FloatField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["food", "nutrient"],
                name="unique_food_nutrient",
            ),
        ]
