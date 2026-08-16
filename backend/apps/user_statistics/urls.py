from apps.user_statistics.api import GraphLineViewSet, GraphViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"graphs", GraphViewSet, basename="graph")
router.register(r"graph-lines", GraphLineViewSet, basename="graphline")

urlpatterns = router.urls
