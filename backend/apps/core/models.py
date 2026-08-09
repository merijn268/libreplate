from django.conf import settings
from django.db import models
from django.db.models import Q

# TODO: add abbreviation model?
# TODO: Add amount model maybe?


class ExclusiveMixin(models.Model):
    """
    Base class for model mixins that cannot be combined with
    specific other mixins.
    """

    incompatible_mixins = ()
    """
    Subclasses can define `incompatible_mixins` that are not allowed
    anywhere in the model's inheritance hierarchy.
    """

    class Meta:
        abstract = True

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)

        inherited_mixins = set(cls.__mro__[1:])

        for mixin in cls.__mro__[1:]:
            incompatible_mixins = getattr(
                mixin,
                "incompatible_mixins",
                (),
            )

            for incompatible in incompatible_mixins:
                if incompatible in inherited_mixins:
                    raise TypeError(
                        f"{cls.__name__} cannot inherit from both "
                        f"{mixin.__name__} and "
                        f"{incompatible.__name__}."
                    )


class HasName(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

    class Meta:
        abstract = True
        ordering = ["name"]


class UserScoped(ExclusiveMixin):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Leave empty for a global object.",
    )

    class Meta:
        abstract = True


class BelongsToUser(ExclusiveMixin):
    incompatible_mixins = (UserScoped,)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )

    class Meta:
        abstract = True


class UserScopedNamed(UserScoped, HasName):
    incompatible_mixins = (BelongsToUser,)

    class Meta:
        abstract = True

        constraints = [
            models.UniqueConstraint(
                fields=["name"],
                condition=Q(user__isnull=True),
                name="unique_global_%(class)s_name",
            ),
            models.UniqueConstraint(
                fields=["user", "name"],
                condition=Q(user__isnull=False),
                name="unique_user_%(class)s_name",
            ),
        ]


class HasDescription(models.Model):
    description = models.TextField(blank=True)

    class Meta:
        abstract = True


class HasTimestamps(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class TracksUsage(models.Model):
    last_used_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        abstract = True


class CanBeFavorited(models.Model):
    is_favorite = models.BooleanField(default=False)

    class Meta:
        abstract = True
