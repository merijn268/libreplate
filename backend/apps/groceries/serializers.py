from rest_framework import serializers

from .models import GroceryList, GroceryListFood


class GroceryListSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroceryList
        fields = ("id", "date_start", "date_end", "created_at", "updated_at", "name")


class GroceryListFoodSerializer(serializers.ModelSerializer):
    # Include the food name so clients can render the grocery list without
    # making an additional request to look up each food by its ID.
    food_name = serializers.CharField(source="food.name", read_only=True)
    on_hand = serializers.BooleanField(read_only=True)

    class Meta:
        model = GroceryListFood
        fields = (
            "id",
            "food",
            "food_name",
            "amount",
            "on_hand",
        )
