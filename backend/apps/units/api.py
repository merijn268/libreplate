from rest_framework.authentication import SessionAuthentication
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated

from .models import Unit
from .serializers import UnitSerializer


class UnitListAPI(ListAPIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    serializer_class = UnitSerializer

    queryset = Unit.objects.all()
