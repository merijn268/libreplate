from django.urls import path

from .api import GroceryListFoodViewSet, GroceryListViewSet

grocery_list = GroceryListViewSet.as_view(
    {
        "get": "list",
        "post": "create",
    }
)

grocery_detail = GroceryListViewSet.as_view(
    {
        "get": "retrieve",
        "delete": "destroy",
    }
)

item_list = GroceryListFoodViewSet.as_view(
    {
        "get": "list",
        "post": "create",
    }
)

item_detail = GroceryListFoodViewSet.as_view(
    {
        "patch": "partial_update",
        "delete": "destroy",
    }
)

item_toggle = GroceryListFoodViewSet.as_view(
    {
        "post": "toggle",
    }
)

urlpatterns = [
    path("", grocery_list),
    path("<int:pk>/", grocery_detail),
    path("<int:grocery_pk>/items/", item_list),
    path("<int:grocery_pk>/items/<int:pk>/", item_detail),
    path("<int:grocery_pk>/items/<int:pk>/toggle/", item_toggle),
]
