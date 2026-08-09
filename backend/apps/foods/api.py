from apps.tags.serializers import TagSerializer
from django.db.models import QuerySet
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from .models import Food, FoodTag
from .serializers import FoodSerializer


class FoodViewSet(ModelViewSet):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = FoodSerializer

    def get_queryset(self) -> QuerySet[Food]:
        if getattr(self, "swagger_fake_view", False):
            return Food.objects.none()

        return (
            Food.objects.filter(user=self.request.user)
            .select_related("unit")
            .prefetch_related("tags", "food_nutrients__nutrient")
        )

    def perform_create(self, serializer: FoodSerializer) -> None:
        serializer.save(user=self.request.user)


class FoodTagViewSet(ModelViewSet):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = TagSerializer

    def get_queryset(self) -> QuerySet[FoodTag]:
        if getattr(self, "swagger_fake_view", False):
            return FoodTag.objects.none()

        return FoodTag.objects.filter(user=self.request.user)

    def perform_create(self, serializer: TagSerializer) -> None:
        serializer.save(user=self.request.user)
