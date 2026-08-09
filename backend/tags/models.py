from core import models as core_models


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
