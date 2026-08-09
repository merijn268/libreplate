from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import serializers, viewsets
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DefaultMeal, Meal, MealFood
from .serializers import (
    DayMealSerializer,
    DefaultMealSerializer,
    MealFoodCreateSerializer,
    MealSerializer,
)


class MealViewSet(viewsets.ModelViewSet):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = MealSerializer

    def get_queryset(self):
        return (
            Meal.objects.filter(
                user=self.request.user,
            )
            .select_related(
                "default_meal",
            )
            .prefetch_related(
                "meal_foods__food",
                "meal_foods__food__unit",
            )
        )

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
        )


class DefaultMealViewSet(viewsets.ModelViewSet):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = DefaultMealSerializer

    def get_queryset(self):
        return DefaultMeal.objects.filter(
            user=self.request.user,
        )

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
        )


class DayMealsAPIView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="day",
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.PATH,
                description="Date to retrieve meals for.",
            )
        ],
        responses=DayMealSerializer(many=True),
        description=(
            "Returns every meal slot for a given day. "
            "Each slot corresponds to a DefaultMeal. "
            "If a Meal exists for that slot, meal_id is populated. "
            "Otherwise meal_id is null."
        ),
    )
    def get(self, request, day):
        defaults = list(
            DefaultMeal.objects.filter(
                user=request.user,
            ).order_by("order")
        )

        meals = (
            Meal.objects.filter(
                user=request.user,
                date=day,
            )
            .select_related(
                "default_meal",
            )
            .prefetch_related(
                "meal_foods__food",
                "meal_foods__food__unit",
            )
        )

        meals_by_default = {meal.default_meal_id: meal for meal in meals}

        response = []

        for default in defaults:
            meal = meals_by_default.get(default.id)

            if meal:
                response.append(
                    {
                        "meal_id": meal.id,
                        "default_meal": default,
                        "name": meal.name,
                        "date": meal.date,
                        "note": meal.note,
                        "order": default.order,
                        "meal_foods": meal.meal_foods.all(),
                    }
                )

            else:
                response.append(
                    {
                        "meal_id": None,
                        "default_meal": default,
                        "name": default.name,
                        "date": day,
                        "note": "",
                        "order": default.order,
                        "meal_foods": [],
                    }
                )

        serializer = DayMealSerializer(
            response,
            many=True,
            context={
                "request": request,
            },
        )

        return Response(serializer.data)


class MealFoodViewSet(viewsets.ModelViewSet):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = MealFoodCreateSerializer

    def get_queryset(self):
        return MealFood.objects.filter(
            meal__user=self.request.user,
        ).select_related(
            "meal",
            "food",
            "food__unit",
        )

    def perform_create(self, serializer):
        meal = serializer.validated_data["meal"]

        if meal.user != self.request.user:
            raise serializers.ValidationError(
                "You cannot add food to another user's meal."
            )

        serializer.save()
