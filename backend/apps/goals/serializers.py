from apps.body_metrics.models import BodyMetric
from apps.body_metrics.serializers import BodyMetricSerializer
from apps.nutrients.models import Nutrient
from apps.nutrients.serializers import NutrientBriefSerializer
from rest_framework import serializers

from .models import GoalBodyMetric, GoalNutrient, GoalPlan


class GoalNutrientSerializer(serializers.ModelSerializer):
    """
    A single nutrient target within a goal plan.
    """

    nutrient = NutrientBriefSerializer(read_only=True)
    nutrient_id = serializers.PrimaryKeyRelatedField(
        queryset=Nutrient.objects.all(),
        source="nutrient",
        write_only=True,
    )

    class Meta:
        model = GoalNutrient
        fields = (
            "id",
            "nutrient",
            "nutrient_id",
            "amount",
        )
        read_only_fields = ("id",)


class GoalBodyMetricSerializer(serializers.ModelSerializer):
    """
    A single body metric target within a goal plan.
    """

    body_metric = BodyMetricSerializer(read_only=True)
    body_metric_id = serializers.PrimaryKeyRelatedField(
        queryset=BodyMetric.objects.all(),
        source="body_metric",
        write_only=True,
    )

    class Meta:
        model = GoalBodyMetric
        fields = (
            "id",
            "body_metric",
            "body_metric_id",
            "amount",
        )
        read_only_fields = ("id",)


class GoalPlanSerializer(serializers.ModelSerializer):
    """
    A goal plan, with its nested nutrient and body metric targets.

    On write, `nutrient_goals` / `body_metric_goals` are treated as the
    full desired set: items already present (matched by nutrient /
    body_metric) are updated, new items are created, and anything left
    out of the payload is removed.
    """

    nutrient_goals = GoalNutrientSerializer(many=True, required=False)
    body_metric_goals = GoalBodyMetricSerializer(many=True, required=False)

    class Meta:
        model = GoalPlan
        fields = (
            "id",
            "name",
            "description",
            "start_date",
            "end_date",
            "nutrient_goals",
            "body_metric_goals",
        )
        read_only_fields = ("id",)

    def create(self, validated_data):
        nutrient_goals_data = validated_data.pop("nutrient_goals", [])
        body_metric_goals_data = validated_data.pop("body_metric_goals", [])

        request = self.context["request"]
        goal_plan = GoalPlan.objects.create(user=request.user, **validated_data)

        self._sync_nutrient_goals(goal_plan, nutrient_goals_data)
        self._sync_body_metric_goals(goal_plan, body_metric_goals_data)

        return goal_plan

    def update(self, instance, validated_data):
        nutrient_goals_data = validated_data.pop("nutrient_goals", None)
        body_metric_goals_data = validated_data.pop("body_metric_goals", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if nutrient_goals_data is not None:
            self._sync_nutrient_goals(instance, nutrient_goals_data)

        if body_metric_goals_data is not None:
            self._sync_body_metric_goals(instance, body_metric_goals_data)

        return instance

    def _sync_nutrient_goals(self, goal_plan, nutrient_goals_data):
        keep_ids = []
        for item in nutrient_goals_data:
            obj, _ = GoalNutrient.objects.update_or_create(
                goal_plan=goal_plan,
                nutrient=item["nutrient"],
                defaults={"amount": item["amount"]},
            )
            keep_ids.append(obj.id)

        goal_plan.nutrient_goals.exclude(id__in=keep_ids).delete()

    def _sync_body_metric_goals(self, goal_plan, body_metric_goals_data):
        keep_ids = []
        for item in body_metric_goals_data:
            obj, _ = GoalBodyMetric.objects.update_or_create(
                goal_plan=goal_plan,
                body_metric=item["body_metric"],
                defaults={"amount": item["amount"]},
            )
            keep_ids.append(obj.id)

        goal_plan.body_metric_goals.exclude(id__in=keep_ids).delete()
