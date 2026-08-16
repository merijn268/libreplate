from rest_framework.routers import DefaultRouter

from .api import GoalBodyMetricViewSet, GoalNutrientViewSet, GoalPlanViewSet

router = DefaultRouter()
router.register("goal-plans", GoalPlanViewSet, basename="goal-plan")
router.register("goal-nutrients", GoalNutrientViewSet, basename="goal-nutrient")
router.register("goal-body-metrics", GoalBodyMetricViewSet, basename="goal-body-metric")

urlpatterns = router.urls
