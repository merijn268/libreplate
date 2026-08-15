from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedDefaultRouter

from .api import GroceryListFoodViewSet, GroceryListViewSet

router = DefaultRouter()

router.register(
    prefix="",
    viewset=GroceryListViewSet,
    basename="grocery-list",
)

grocery_router = NestedDefaultRouter(
    parent_router=router,
    parent_prefix="",
    lookup="grocery",
)

grocery_router.register(
    prefix="items",
    viewset=GroceryListFoodViewSet,
    basename="grocery-item",
)

urlpatterns = router.urls + grocery_router.urls
