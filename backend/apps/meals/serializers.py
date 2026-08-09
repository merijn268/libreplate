from apps.foods.models import Food
from apps.foods.serializers import FoodSerializer
from django.db import transaction
from rest_framework import serializers

from .models import DefaultMeal, Meal, MealFood


class MealFoodSerializer(serializers.ModelSerializer):
    food_id = serializers.PrimaryKeyRelatedField(
        queryset=Food.objects.all(),
        source="food",
        write_only=True,
    )

    food = FoodSerializer(
        read_only=True,
    )

    class Meta:
        model = MealFood

        fields = [
            "id",
            "food_id",
            "food",
            "serving_size",
            "number_of_servings",
        ]

        read_only_fields = [
            "id",
            "food",
        ]

    def validate_food_id(self, food):
        request = self.context["request"]

        if food.user != request.user:
            raise serializers.ValidationError(
                "You cannot add foods belonging to another user."
            )

        return food


class MealSerializer(serializers.ModelSerializer):
    meal_foods = MealFoodSerializer(
        many=True,
        required=False,
    )

    class Meta:
        model = Meal

        fields = [
            "id",
            "default_meal",
            "name",
            "date",
            "note",
            "order",
            "meal_foods",
        ]

        read_only_fields = [
            "id",
        ]

    @transaction.atomic
    def create(self, validated_data):
        meal_foods = validated_data.pop(
            "meal_foods",
            [],
        )

        meal = Meal.objects.create(
            **validated_data,
        )

        MealFood.objects.bulk_create(
            [
                MealFood(
                    meal=meal,
                    **food,
                )
                for food in meal_foods
            ]
        )

        return meal

    @transaction.atomic
    def update(
        self,
        instance,
        validated_data,
    ):
        meal_foods = validated_data.pop(
            "meal_foods",
            None,
        )

        for attr, value in validated_data.items():
            setattr(
                instance,
                attr,
                value,
            )

        instance.save()

        if meal_foods is not None:
            instance.meal_foods.all().delete()

            MealFood.objects.bulk_create(
                [
                    MealFood(
                        meal=instance,
                        **food,
                    )
                    for food in meal_foods
                ]
            )

        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        representation["meal_foods"] = MealFoodSerializer(
            instance.meal_foods.select_related(
                "food",
                "food__unit",
            ),
            many=True,
            context=self.context,
        ).data

        return representation


class DefaultMealSerializer(serializers.ModelSerializer):
    class Meta:
        model = DefaultMeal

        fields = [
            "id",
            "name",
            "description",
            "order",
        ]

        read_only_fields = [
            "id",
        ]


class DayMealSerializer(serializers.Serializer):
    """
    Serializer representing a meal slot for a specific day.

    If meal_id is null, the slot has not yet been persisted.
    """

    meal_id = serializers.IntegerField(
        allow_null=True,
    )

    default_meal = DefaultMealSerializer()

    name = serializers.CharField()

    date = serializers.DateField()

    note = serializers.CharField()

    order = serializers.IntegerField()

    meal_foods = MealFoodSerializer(
        many=True,
    )


class MealFoodCreateSerializer(serializers.ModelSerializer):
    meal_id = serializers.PrimaryKeyRelatedField(
        queryset=Meal.objects.all(),
        source="meal",
    )

    food_id = serializers.PrimaryKeyRelatedField(
        queryset=Food.objects.all(),
        source="food",
    )

    class Meta:
        model = MealFood

        fields = [
            "id",
            "meal_id",
            "food_id",
            "serving_size",
            "number_of_servings",
        ]

        read_only_fields = [
            "id",
        ]

    def validate_food_id(self, food):

        request = self.context["request"]

        if food.user != request.user:
            raise serializers.ValidationError(
                "You cannot add foods belonging to another user."
            )

        return food
