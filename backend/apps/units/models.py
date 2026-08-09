from apps.core import models as core_models
from django.db import models
from django.db.models import Q


class Unit(
    core_models.UserScoped,
    core_models.HasName,
    core_models.HasDescription,
    core_models.HasTimestamps,
):
    """
    Represents a unit of measurement.
    """

    abbreviation = models.CharField(max_length=15, blank=True)

    # TODO "visable", is not a good name for it. It should be more descriptive.
    # These flags mean that it shows in a dropdown menu for a user when they can
    # pick a unit. Preferably it inherits something from a base class, since
    # These variables get used more often with objects in this codebase.

    visible_in_nutrients = models.BooleanField(default=False)
    visible_in_body_metrics = models.BooleanField(default=False)
    visible_in_foods = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["name"],
                condition=Q(user__isnull=True),
                name="unique_global_unit_name",
            ),
            models.UniqueConstraint(
                fields=["user", "name"],
                condition=Q(user__isnull=False),
                name="unique_user_unit_name",
            ),
        ]

    def __str__(self):
        return self.name
