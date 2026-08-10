from apps.core import models as core_models
from django.db import models


class BaseTag(
    core_models.HasName,
    core_models.BelongsToUser,
    core_models.HasDescription,
    core_models.HasTimestamps,
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
