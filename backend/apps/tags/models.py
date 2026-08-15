from apps.core.models import base as base_models
from django.db import models


class BaseTag(
    base_models.HasName,
    base_models.BelongsToUser,
    base_models.HasDescription,
    base_models.HasTimestamps,
):
    """
    Abstract base model for user-owned tags with a name, description,
    and creation/update timestamps.
    """

    class Meta:
        abstract = True
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"],
                name="unique_%(class)s_tag",
            ),
        ]
