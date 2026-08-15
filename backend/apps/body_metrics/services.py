from django.db import transaction

from .defaults import DEFAULT_BODY_METRICS
from .models import BodyMetric, BodyMetricsVisibility


# TODO visibility data default code should be in code. This will get used
# more often.
@transaction.atomic
def sync_default_body_metrics(overwrite=False):
    for body_metric in DEFAULT_BODY_METRICS:
        metric_data = body_metric.model_dump(exclude={"name"})

        visibility_data = {
            "show_in_diary": metric_data.pop("show_in_diary"),
            "show_in_goal_edit": metric_data.pop("show_in_goal_edit"),
        }

        if overwrite:
            body_metric_obj = BodyMetric.objects.filter(
                name=body_metric.name,
            ).first()

            if body_metric_obj is None:
                visibility = BodyMetricsVisibility.objects.create(
                    **visibility_data,
                )

                BodyMetric.objects.create(
                    name=body_metric.name,
                    visibility=visibility,
                    **metric_data,
                )
                continue

            BodyMetric.objects.filter(pk=body_metric_obj.pk).update(
                **metric_data,
            )

            BodyMetricsVisibility.objects.filter(
                pk=body_metric_obj.visibility_id,
            ).update(
                **visibility_data,
            )

        else:
            if BodyMetric.objects.filter(
                name=body_metric.name,
            ).exists():
                continue

            visibility = BodyMetricsVisibility.objects.create(
                **visibility_data,
            )

            BodyMetric.objects.create(
                name=body_metric.name,
                visibility=visibility,
                **metric_data,
            )
