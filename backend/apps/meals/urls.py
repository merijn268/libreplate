from django.urls import path

from .api import DayMealsAPIView, DefaultMealViewSet, MealFoodViewSet, MealViewSet

urlpatterns = [
    path(
        "meal-foods/",
        MealFoodViewSet.as_view(
            {
                "post": "create",
            }
        ),
        name="meal-food-create",
    ),
    path(
        "meal-foods/<int:pk>/",
        MealFoodViewSet.as_view(
            {
                "patch": "partial_update",
                "put": "update",
                "delete": "destroy",
            }
        ),
        name="meal-food-detail",
    ),
    path(
        "",
        MealViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="meal-list",
    ),
    path(
        "<int:pk>/",
        MealViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="meal-detail",
    ),
    path(
        "defaults/",
        DefaultMealViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="default-meal-list",
    ),
    path(
        "defaults/<int:pk>/",
        DefaultMealViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="default-meal-detail",
    ),
    path(
        "day/<str:day>/",
        DayMealsAPIView.as_view(),
        name="day-meals",
    ),
]
