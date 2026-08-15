from apps.meal_plans.models import MealPlan
from rest_framework import serializers

from .models import GroceryList, GroceryListFood


class GroceryListSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroceryList
        fields = [
            "id",
            "name",
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
    class Meta:
        model = GroceryListFood
        fields = [
            "id",
            "food",
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
    )
    length_days = serializers.IntegerField(
        min_value=1,
        max_value=31,
    )

    def validate_meal_plan(self, meal_plan):
        request = self.context["request"]

        if meal_plan.user_id != request.user.id:
            raise serializers.ValidationError(
                "You do not have access to this meal plan."
            )

        return meal_plan
