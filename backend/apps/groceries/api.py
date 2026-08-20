from apps.meal_plans.models.meal_plans import MealPlan
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import GroceryList, GroceryListFood
from .serializers import (
    GroceryListFoodSerializer,
    GroceryListGenerateSerializer,
    GroceryListSerializer,
)
from .services import GroceryListGenerator


class GroceryListViewSet(viewsets.ModelViewSet):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = GroceryListSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return GroceryList.objects.none()

        return GroceryList.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @extend_schema(
        request=GroceryListGenerateSerializer,
        responses={201: GroceryListSerializer},
    )
    @action(detail=False, methods=["post"])
    def generate(self, request):
        serializer = GroceryListGenerateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        meal_plan = serializer.validated_data.get(
            "meal_plan"
        ) or MealPlan.get_active_instance(user=request.user)

        if meal_plan is None:
            return Response(
                {"detail": "You do not have an active meal plan."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        grocery_list = GroceryListGenerator(
            meal_plan=meal_plan,
            length_days=serializer.validated_data["length_days"],
        ).generate()

        return Response(
            GroceryListSerializer(
                grocery_list,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema(
    parameters=[
        OpenApiParameter(
            name="grocery_pk",
            type=int,
            location=OpenApiParameter.PATH,
        ),
        OpenApiParameter(
            name="id",
            type=int,
            location=OpenApiParameter.PATH,
        ),
    ],
)
class GroceryListFoodViewSet(viewsets.ModelViewSet):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = GroceryListFoodSerializer

    def get_queryset(self):
        return GroceryListFood.objects.filter(
            grocery_list__user=self.request.user,
            grocery_list_id=self.kwargs["grocery_pk"],
        )

    def perform_create(self, serializer):
        grocery = get_object_or_404(
            GroceryList,
            pk=self.kwargs["grocery_pk"],
            user=self.request.user,
        )
        serializer.save(grocery_list=grocery)

    @action(detail=True, methods=["post"])
    def toggle(self, request, grocery_pk=None, pk=None):
        grocery_item = self.get_object()

        grocery_item.on_hand = not grocery_item.on_hand
        grocery_item.save(update_fields=["on_hand"])

        return Response(
            GroceryListFoodSerializer(
                grocery_item,
                context={"request": request},
            ).data,
            status=status.HTTP_200_OK,
        )
