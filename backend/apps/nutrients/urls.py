from django.urls import path

from .api import NutrientViewSet

nutrient_list = NutrientViewSet.as_view(
    {
        "get": "list",
    }
)


nutrient_detail = NutrientViewSet.as_view(
    {
        "get": "retrieve",
    }
)


urlpatterns = [
    path(
        "",
        nutrient_list,
        name="nutrient-list",
    ),
    path(
        "<int:pk>/",
        nutrient_detail,
        name="nutrient-detail",
    ),
]
