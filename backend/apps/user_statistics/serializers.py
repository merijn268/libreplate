from apps.user_statistics.models import (
    Graph,
    GraphLine,
    GraphLineBodyMetric,
    GraphLineNutrient,
)
from rest_framework import serializers


class GraphLineBodyMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = GraphLineBodyMetric
        fields = ["body_metric"]


class GraphLineNutrientSerializer(serializers.ModelSerializer):
    class Meta:
        model = GraphLineNutrient
        fields = ["nutrient"]


class GraphLineSerializer(serializers.ModelSerializer):
    """
    Nested writable serializer for GraphLine. Exactly one of `body_metric` /
    `nutrient` must be provided, mirroring GraphLine.clean().
    """

    body_metric = GraphLineBodyMetricSerializer(required=False, allow_null=True)
    nutrient = GraphLineNutrientSerializer(required=False, allow_null=True)

    class Meta:
        model = GraphLine
        fields = [
            "id",
            "graph",
            "name",
            "description",
            "moving_average_unit",
            "moving_average_amount",
            "body_metric",
            "nutrient",
        ]

    def validate(self, attrs):
        body_metric = attrs.get("body_metric", serializers.empty)
        nutrient = attrs.get("nutrient", serializers.empty)
        instance = self.instance

        if body_metric is serializers.empty:
            will_have_body_metric = bool(instance and hasattr(instance, "body_metric"))
        else:
            will_have_body_metric = body_metric is not None

        if nutrient is serializers.empty:
            will_have_nutrient = bool(instance and hasattr(instance, "nutrient"))
        else:
            will_have_nutrient = nutrient is not None

        if will_have_body_metric == will_have_nutrient:
            raise serializers.ValidationError(
                "A GraphLine must have exactly one of `body_metric` or `nutrient`."
            )

        return attrs

    def create(self, validated_data):
        body_metric_data = validated_data.pop("body_metric", None)
        nutrient_data = validated_data.pop("nutrient", None)

        graph_line = GraphLine.objects.create(**validated_data)

        if body_metric_data:
            GraphLineBodyMetric.objects.create(
                graph_line=graph_line, **body_metric_data
            )

        if nutrient_data:
            GraphLineNutrient.objects.create(graph_line=graph_line, **nutrient_data)

        return graph_line

    def update(self, instance, validated_data):
        body_metric_data = validated_data.pop("body_metric", serializers.empty)
        nutrient_data = validated_data.pop("nutrient", serializers.empty)

        instance = super().update(instance, validated_data)

        if body_metric_data is not serializers.empty:
            if body_metric_data is None:
                GraphLineBodyMetric.objects.filter(graph_line=instance).delete()
            else:
                GraphLineBodyMetric.objects.update_or_create(
                    graph_line=instance, defaults=body_metric_data
                )

        if nutrient_data is not serializers.empty:
            if nutrient_data is None:
                GraphLineNutrient.objects.filter(graph_line=instance).delete()
            else:
                GraphLineNutrient.objects.update_or_create(
                    graph_line=instance, defaults=nutrient_data
                )

        return instance


class GraphSerializer(serializers.ModelSerializer):
    lines = GraphLineSerializer(many=True, read_only=True)

    class Meta:
        model = Graph
        fields = [
            "id",
            "user",
            "name",
            "description",
            "is_favorite",
            "graph_type",
            "period_unit",
            "period_amount",
            "period_end_mode",
            "period_end_date",
            "range_type",
            "lines",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["user", "created_at", "updated_at"]
