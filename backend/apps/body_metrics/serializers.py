from apps.body_metrics.models import BodyMetric, BodyMetricLog
from rest_framework import serializers


class BodyMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = BodyMetric
        fields = (
            "id",
            "name",
            "description",
            "is_single_entry",
        )
        read_only_fields = fields


class BodyMetricLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = BodyMetricLog
        fields = (
            "id",
            "body_metric",
            "date",
            "amount",
            "note",
        )
        read_only_fields = ("id",)

    def validate_body_metric(self, body_metric):
        user = self.context["request"].user

        # A body metric may either be global or owned by the current user.
        if body_metric.user_id is not None and body_metric.user_id != user.id:
            raise serializers.ValidationError(
                "You do not have access to this body metric."
            )

        return body_metric

    def validate(self, attrs):
        user = self.context["request"].user
        body_metric = attrs["body_metric"]
        date = attrs["date"]

        if body_metric.is_single_entry:
            if BodyMetricLog.objects.filter(
                body_metric=body_metric,
                user=user,
            ).exists():
                raise serializers.ValidationError(
                    {
                        "body_metric": (
                            "This body metric only allows a single log entry."
                        )
                    }
                )

        if BodyMetricLog.objects.filter(
            body_metric=body_metric,
            user=user,
            date=date,
        ).exists():
            raise serializers.ValidationError(
                {"date": "A log for this body metric already exists for this date."}
            )

        return attrs
