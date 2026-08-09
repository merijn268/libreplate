from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import Nutrient
from .serializers import NutrientSerializer


class NutrientViewSet(ReadOnlyModelViewSet):
    serializer_class = NutrientSerializer
    permission_classes = [IsAuthenticated]

    queryset = Nutrient.objects.all()
