from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import GroceryList, GroceryListFood
from .serializers import GroceryListFoodSerializer, GroceryListSerializer


class GroceryListViewSet(viewsets.ModelViewSet):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = GroceryListSerializer

    def get_queryset(self):
        return GroceryList.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


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
            GroceryListFoodSerializer(grocery_item).data,
            status=status.HTTP_200_OK,
        )
