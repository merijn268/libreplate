from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    MealPlan,
    PlannedMeal,
    PlannedMealFood,
    PlannedMealRecipe,
)
from .serializers import (
    MealPlanApplySerializer,
    MealPlanMinimalSerializer,
    MealPlanSerializer,
    PlannedMealFoodSerializer,
    PlannedMealRecipeSerializer,
    PlannedMealSerializer,
)


class MealPlanViewSet(viewsets.ModelViewSet):
    queryset = MealPlan.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MealPlan.objects.filter(
            user=self.request.user,
        ).prefetch_related(
            "tags",
            "planned_meals",
        )

    def get_serializer_class(self):
        if self.action == "list":
            return MealPlanMinimalSerializer
        return MealPlanSerializer

    @action(detail=False, methods=["get"])
    def active(self, request):
        """Return the user's currently active meal plan."""

        meal_plan = (
            self.get_queryset()
            .filter(
                is_active=True,
            )
            .first()
        )

        if meal_plan is None:
            return Response(
                {"detail": "No active meal plan."},
                status=404,
            )

        serializer = MealPlanSerializer(
            meal_plan,
            context=self.get_serializer_context(),
        )

        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        """Make this meal plan the user's active meal plan."""

        meal_plan = self.get_object()
        meal_plan.activate()

        serializer = MealPlanSerializer(
            meal_plan,
            context=self.get_serializer_context(),
        )

        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        """Deactivate this meal plan."""

        meal_plan = self.get_object()
        meal_plan.deactivate()

        serializer = MealPlanSerializer(
            meal_plan,
            context=self.get_serializer_context(),
        )

        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def mark_used(self, request, pk=None):
        """Stamp last_used_at to now."""

        meal_plan = self.get_object()
        meal_plan.last_used_at = timezone.now()
        meal_plan.save(update_fields=["last_used_at"])

        serializer = self.get_serializer(meal_plan)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def mark_favorite(self, request, pk=None):
        meal_plan = self.get_object()
        meal_plan.is_favorite = True
        meal_plan.save(update_fields=["is_favorite"])

        serializer = self.get_serializer(meal_plan)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def unmark_favorite(self, request, pk=None):
        meal_plan = self.get_object()
        meal_plan.is_favorite = False
        meal_plan.save(update_fields=["is_favorite"])

        serializer = self.get_serializer(meal_plan)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def apply(self, request, pk=None):
        """
        Apply this meal plan onto real Meal slots.

        Body: {"start_date": "YYYY-MM-DD", "days": 1-7 (default 7)}

        `start_date` maps to the meal plan's own day 0; each following
        day maps to the next meal-plan day (wrapping if `days` exceeds
        the plan's duration). Meals that already have food entries are
        left untouched; recipe entries are unfolded into foods, since
        Meal/MealFood doesn't support recipes directly.
        """
        meal_plan = self.get_object()

        input_serializer = MealPlanApplySerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        summary = meal_plan.apply(
            start_date=input_serializer.validated_data["start_date"],
            days=input_serializer.validated_data["days"],
        )

        return Response(summary)


class PlannedMealViewSet(viewsets.ModelViewSet):
    """CRUD for meals within the current user's meal plans."""

    queryset = PlannedMeal.objects.all()
    serializer_class = PlannedMealSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = PlannedMeal.objects.filter(
            meal_plan__user=self.request.user,
        )

        meal_plan_id = self.request.query_params.get("meal_plan")
        if meal_plan_id is not None:
            queryset = queryset.filter(
                meal_plan_id=meal_plan_id,
            )

        return queryset


class PlannedMealFoodViewSet(viewsets.ModelViewSet):
    """CRUD for food entries within the current user's meal plans."""

    queryset = PlannedMealFood.objects.all()
    serializer_class = PlannedMealFoodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = PlannedMealFood.objects.filter(
            planned_meal__meal_plan__user=self.request.user,
        )

        meal_plan_id = self.request.query_params.get("meal_plan")
        if meal_plan_id is not None:
            queryset = queryset.filter(
                planned_meal__meal_plan_id=meal_plan_id,
            )

        planned_meal_id = self.request.query_params.get("planned_meal")
        if planned_meal_id is not None:
            queryset = queryset.filter(
                planned_meal_id=planned_meal_id,
            )

        return queryset


class PlannedMealRecipeViewSet(viewsets.ModelViewSet):
    """CRUD for recipe entries within the current user's meal plans."""

    queryset = PlannedMealRecipe.objects.all()
    serializer_class = PlannedMealRecipeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = PlannedMealRecipe.objects.filter(
            planned_meal__meal_plan__user=self.request.user,
        )

        meal_plan_id = self.request.query_params.get("meal_plan")
        if meal_plan_id is not None:
            queryset = queryset.filter(
                planned_meal__meal_plan_id=meal_plan_id,
            )

        planned_meal_id = self.request.query_params.get("planned_meal")
        if planned_meal_id is not None:
            queryset = queryset.filter(
                planned_meal_id=planned_meal_id,
            )

        return queryset
