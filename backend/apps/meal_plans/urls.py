from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .api import (
    MealPlanViewSet,
    PlannedMealFoodViewSet,
    PlannedMealRecipeViewSet,
    PlannedMealViewSet,
    RandomizerItemViewSet,
)

# TODO introduce namespaces

# app_name = "meal_plans"

router = DefaultRouter()

router.register(
    prefix="planned-meals",
    viewset=PlannedMealViewSet,
    basename="planned-meal",
)

router.register(
    prefix="foods",
    viewset=PlannedMealFoodViewSet,
    basename="meal-plan-food",
)

router.register(
    prefix="recipes",
    viewset=PlannedMealRecipeViewSet,
    basename="meal-plan-recipe",
)

router.register(
    prefix="randomizers",
    viewset=RandomizerItemViewSet,
    basename="meal-plan-randomizer",
)

router.register(
    prefix="",
    viewset=MealPlanViewSet,
    basename="meal-plan",
)

urlpatterns = [
    path("", include(router.urls)),
]
