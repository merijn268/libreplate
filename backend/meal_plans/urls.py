from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .api import MealPlanFoodViewSet, MealPlanRecipeViewSet, MealPlanViewSet

# TODO introduce namespaces
# app_name = "meal_plans"

router = DefaultRouter()
router.register(
    prefix="",
    viewset=MealPlanViewSet,
    basename="meal-plan",
)
router.register(
    prefix="foods",
    viewset=MealPlanFoodViewSet,
    basename="meal-plan-food",
)
router.register(
    prefix=r"recipes",
    viewset=MealPlanRecipeViewSet,
    basename="meal-plan-recipe",
)

urlpatterns = [
    path("", include(router.urls)),
]
