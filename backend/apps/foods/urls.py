from rest_framework.routers import DefaultRouter

from .api import FoodTagViewSet, FoodViewSet

router = DefaultRouter()

router.register("", FoodViewSet, basename="food")
router.register("tags", FoodTagViewSet, basename="food-tag")


urlpatterns = router.urls
