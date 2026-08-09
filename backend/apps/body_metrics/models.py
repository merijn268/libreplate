from apps.core import models as core_models
from django.db import models
from django.db.models import Q


class BodyMetric(
    core_models.UserScopedNamed,
    core_models.CanBeFavorited,
    core_models.HasDescription,
    core_models.HasTimestamps,
    core_models.TracksUsage,
):
    show_in_diary_total = models.BooleanField(
        default=True,
    )
    show_in_goal_edit = models.BooleanField(
        default=True,
    )
    is_single_entry = models.BooleanField(
        default=False,
    )

    class Meta:
        verbose_name = "Nutrients"
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
# off dupplicate data. The Logs do not need a user in that case
class BodyMetricLog(
    core_models.BelongsToUser,
):
    body_metric = models.ForeignKey(
        BodyMetric, on_delete=models.CASCADE, related_name="logs"
    )

    date = models.DateField()

    amount = models.FloatField()
    note = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ("body_metric", "user", "date")
