from apps.foods.models import Food
from apps.foods.serializers import FoodSerializer
from apps.meal_plans.models.meal_plans import MealPlan
from rest_framework import serializers

from .models import GroceryList, GroceryListFood


class GroceryListSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroceryList
        fields = [
            "id",
            "name",
            "description",
            "is_favorite",
            "date_start",
            "date_end",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class GroceryListFoodSerializer(serializers.ModelSerializer):
    food = FoodSerializer(read_only=True)
    food_id = serializers.PrimaryKeyRelatedField(
        queryset=Food.objects.all(),
        source="food",
        write_only=True,
    )

    class Meta:
        model = GroceryListFood
        fields = [
            "id",
            "food",
            "food_id",
            "amount",
            "on_hand",
        ]
        read_only_fields = [
            "id",
        ]


class GroceryListGenerateSerializer(serializers.Serializer):
    meal_plan_id = serializers.PrimaryKeyRelatedField(
        queryset=MealPlan.objects.all(),
        source="meal_plan",
        required=False,
    )
    length_days = serializers.IntegerField(
        min_value=1,
        max_value=31,
        required=False,
        default=7,
    )

    def validate_meal_plan_id(self, meal_plan):
        request = self.context["request"]

        if meal_plan.user_id != request.user.id:
            raise serializers.ValidationError(
                "You do not have access to this meal plan."
            )

        return meal_plan
