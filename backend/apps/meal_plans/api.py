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
    MealPlanListSerializer,
    MealPlanSerializer,
    PlannedMealFoodSerializer,
    PlannedMealRecipeSerializer,
    PlannedMealSerializer,
)


class IsOwner(permissions.BasePermission):
    """Only the owning user can view/edit their meal plans."""

    def has_object_permission(self, request, view, obj):
        if isinstance(obj, MealPlan):
            owner = obj.user
        elif isinstance(obj, PlannedMeal):
            owner = obj.meal_plan.user
        elif isinstance(obj, (PlannedMealFood, PlannedMealRecipe)):
            owner = obj.planned_meal.meal_plan.user
        else:
            return False

        return owner == request.user


class MealPlanViewSet(viewsets.ModelViewSet):
    queryset = MealPlan.objects.all()
    permission_classes = [
        permissions.IsAuthenticated,
        IsOwner,
    ]

    def get_queryset(self):
        return MealPlan.objects.filter(user=self.request.user).prefetch_related(
            "tags",
            "planned_meals",
            "planned_meals__entries",
            "planned_meals__entries__recurrence",
        )

    def get_serializer_class(self):
        if self.action == "list":
            return MealPlanListSerializer

        return MealPlanSerializer

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


class PlannedMealViewSet(viewsets.ModelViewSet):
    """CRUD for meals within the current user's meal plans."""

    queryset = PlannedMeal.objects.all()
    serializer_class = PlannedMealSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        IsOwner,
    ]

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
    permission_classes = [
        permissions.IsAuthenticated,
        IsOwner,
    ]

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
    permission_classes = [
        permissions.IsAuthenticated,
        IsOwner,
    ]

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
