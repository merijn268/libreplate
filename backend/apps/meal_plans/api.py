from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import MealPlan, MealPlanFood, MealPlanRecipe
from .serializers import (
    MealPlanFoodSerializer,
    MealPlanListSerializer,
    MealPlanRecipeSerializer,
    MealPlanSerializer,
)


class IsOwner(permissions.BasePermission):
    """Only the owning user can view/edit their meal plans."""

    def has_object_permission(self, request, view, obj):
        # obj may be a MealPlan, or an entry with a meal_plan FK
        owner = obj.user if hasattr(obj, "user") else obj.meal_plan.user
        return owner == request.user


class MealPlanViewSet(viewsets.ModelViewSet):
    queryset = MealPlan.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        return MealPlan.objects.filter(user=self.request.user).prefetch_related(
            "foods", "recipes", "tags"
        )

    def get_serializer_class(self):
        if self.action == "list":
            return MealPlanListSerializer
        return MealPlanSerializer

    @action(detail=True, methods=["post"])
    def mark_used(self, request, pk=None):
        """Stamp `last_used_at` to now, e.g. when a plan is applied."""
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


class MealPlanFoodViewSet(viewsets.ModelViewSet):
    queryset = MealPlanFood.objects.all()
    serializer_class = MealPlanFoodSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        queryset = MealPlanFood.objects.filter(meal_plan__user=self.request.user)
        meal_plan_id = self.request.query_params.get("meal_plan")
        if meal_plan_id is not None:
            queryset = queryset.filter(meal_plan_id=meal_plan_id)
        return queryset


class MealPlanRecipeViewSet(viewsets.ModelViewSet):
    """
    CRUD for individual recipe entries within the current user's meal plans.

    Optionally filter by `?meal_plan=<id>`.
    """

    queryset = MealPlanRecipe.objects.all()
    serializer_class = MealPlanRecipeSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        queryset = MealPlanRecipe.objects.filter(meal_plan__user=self.request.user)
        meal_plan_id = self.request.query_params.get("meal_plan")
        if meal_plan_id is not None:
            queryset = queryset.filter(meal_plan_id=meal_plan_id)
        return queryset
