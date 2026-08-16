from apps.core.models import base as base_models
from apps.core.models import visibility as visibility_models
from django.db import models
from django.db.models import Q


class BodyMetricsVisibility(
    visibility_models.DailyLogVisibility,
    visibility_models.GoalEditVisibility,
):
    pass


class BodyMetric(
    base_models.UserScopedNamed,
    base_models.CanBeFavorited,
    base_models.HasDescription,
    base_models.HasTimestamps,
    base_models.TracksUsage,
):
    # TODO this variable may not be needed with the proper visibility classes.
    # A user may not want to enter their height multiple times for example.
    # But depending on where this is entered, a visibility class could be used.
    is_single_entry = models.BooleanField(
        default=False, help_text="If only one log entry can be entered."
    )

    visibility = models.OneToOneField(
        BodyMetricsVisibility,
        on_delete=models.CASCADE,
        related_name="body_metric",
    )

    class Meta:
        verbose_name = "Body Metrics"
        constraints = [
            # Global metrics
            models.UniqueConstraint(
                fields=["name"],
                condition=Q(user__isnull=True),
                name="unique_global_body_metric_name",
            ),
            # Per-user metrics
            models.UniqueConstraint(
                fields=["user", "name"],
                condition=Q(user__isnull=False),
                name="unique_user_body_metric_name",
            ),
        ]


# TODO When a user owns a body metric and also the logs, there will be a lot
# of duplicate data. The Logs do not need a user in that case. Consider making
# body metric not global. It also simplifies the code a lot to have user-only
# body metrics.
class BodyMetricLog(
    base_models.BelongsToUser,
    base_models.HasNote,
):
    body_metric = models.ForeignKey(
        BodyMetric, on_delete=models.CASCADE, related_name="logs"
    )
    date = models.DateField()
    amount = models.FloatField()

    class Meta:
        unique_together = ("body_metric", "user", "date")
