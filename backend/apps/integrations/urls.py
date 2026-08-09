from rest_framework.routers import DefaultRouter

from .api import FoodIntegrationViewSet

router = DefaultRouter()

router.register(
    prefix="",
    viewset=FoodIntegrationViewSet,
    basename="integration",
)


urlpatterns = router.urls
