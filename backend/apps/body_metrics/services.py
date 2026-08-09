# body_metrics/services.py

from .defaults import DEFAULT_BODY_METRICS
from .models import BodyMetric


def sync_default_body_metrics(overwrite=False):
    operation = (
        BodyMetric.objects.update_or_create
        if overwrite
        else BodyMetric.objects.get_or_create
    )

    for body_metric in DEFAULT_BODY_METRICS:
        operation(
            name=body_metric.name,
            defaults=body_metric.model_dump(exclude={"name"}),
        )
