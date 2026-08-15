from apps.body_metrics.api import BodyMetricLogViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

router.register(
    r"body-metric-logs",
    BodyMetricLogViewSet,
    basename="body-metric-log",
)

urlpatterns = router.urls
