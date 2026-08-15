from apps.body_metrics.api import BodyMetricLogViewSet, BodyMetricViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

router.register(
    r"body-metric-logs",
    BodyMetricLogViewSet,
    basename="body-metric-log",
)

router.register(
    r"body-metrics",
    BodyMetricViewSet,
    basename="body-metric",
)

urlpatterns = router.urls
