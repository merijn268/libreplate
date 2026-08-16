from apps.core.models import base as base_models
from django.db import models


class GoalPlan(
    base_models.BelongsToUser,
    base_models.CanBeFavorited,
    base_models.HasDescription,
    base_models.HasName,
    base_models.HasTimestamps,
    base_models.TracksUsage,
):
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.name


class GoalNutrient(models.Model):
    nutrient = models.ForeignKey("nutrients.Nutrient", on_delete=models.CASCADE)
    amount = models.FloatField()
    goal_plan = models.ForeignKey(
        GoalPlan,
        on_delete=models.CASCADE,
        related_name="nutrient_goals",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["goal_plan", "nutrient"],
                name="unique_nutrient_per_goal_plan",
            ),
        ]

    def __str__(self):
        return f"{self.nutrient.name} - {self.amount}"


class GoalBodyMetric(models.Model):
    body_metric = models.ForeignKey(
        "body_metrics.BodyMetric",
        on_delete=models.CASCADE,
    )
    amount = models.FloatField()
    goal_plan = models.ForeignKey(
        GoalPlan,
        on_delete=models.CASCADE,
        related_name="body_metric_goals",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["goal_plan", "body_metric"],
                name="unique_body_metric_per_goal_plan",
            ),
        ]

    def __str__(self):
        return f"{self.body_metric.name} - {self.amount}"