from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import GoalBodyMetric, GoalNutrient, GoalPlan
from .serializers import (
    GoalBodyMetricSerializer,
    GoalNutrientSerializer,
    GoalPlanSerializer,
)


class GoalPlanViewSet(viewsets.ModelViewSet):
    """
    CRUD for a user's goal plans, including their nested nutrient and
    body metric targets. Use this endpoint for normal goal-plan editing;
    the nutrient/body-metric endpoints below exist for editing a single
    target in place without resending the whole plan.
    """

    queryset = GoalPlan.objects.all()
    serializer_class = GoalPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            GoalPlan.objects.filter(user=self.request.user)
            .prefetch_related(
                "nutrient_goals__nutrient",
                "body_metric_goals__body_metric",
            )
            .order_by("-created_at")
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class GoalNutrientViewSet(viewsets.ModelViewSet):
    """
    CRUD for individual nutrient targets, scoped to the current user's
    goal plans. Expects a `goal_plan` id in the request body on create.
    """

    queryset = GoalNutrient.objects.all()
    serializer_class = GoalNutrientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return GoalNutrient.objects.filter(
            goal_plan__user=self.request.user
        ).select_related("nutrient", "goal_plan")

    def perform_create(self, serializer):
        goal_plan = GoalPlan.objects.get(
            pk=self.request.data.get("goal_plan"),
            user=self.request.user,
        )
        serializer.save(goal_plan=goal_plan)


class GoalBodyMetricViewSet(viewsets.ModelViewSet):
    """
    CRUD for individual body metric targets, scoped to the current
    user's goal plans. Expects a `goal_plan` id in the request body on
    create.
    """

    queryset = GoalBodyMetric.objects.all()
    serializer_class = GoalBodyMetricSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return GoalBodyMetric.objects.filter(
            goal_plan__user=self.request.user
        ).select_related("body_metric", "goal_plan")

    def perform_create(self, serializer):
        goal_plan = GoalPlan.objects.get(
            pk=self.request.data.get("goal_plan"),
            user=self.request.user,
        )
        serializer.save(goal_plan=goal_plan)
