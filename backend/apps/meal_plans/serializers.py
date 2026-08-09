from apps.foods.models import Food
from apps.foods.serializers import FoodSerializer
from apps.recipes.models import Recipe
from apps.recipes.serializers import RecipeSerializer
from rest_framework import serializers

from .models import MealPlan, MealPlanFood, MealPlanRecipe, MealPlanTag


class MealPlanFoodSerializer(serializers.ModelSerializer):
    food = FoodSerializer(read_only=True)
    food_id = serializers.PrimaryKeyRelatedField(
        queryset=Food.objects.all(),
        source="food",
        write_only=True,
    )

    item_name = serializers.CharField(
        source="get_item_name",
        read_only=True,
    )
    weekday = serializers.CharField(
        source="get_weekday_display",
        read_only=True,
    )

    class Meta:
        model = MealPlanFood
        fields = [
            "id",
            "meal_plan",
            "meal",
            "food",
            "food_id",
            "day",
            "weekday",
            "serving_size",
            "number_of_servings",
            "item_name",
        ]
        extra_kwargs = {
            "meal_plan": {"required": False},
        }


class MealPlanRecipeSerializer(serializers.ModelSerializer):
    recipe = RecipeSerializer(read_only=True)
    recipe_id = serializers.PrimaryKeyRelatedField(
        queryset=Recipe.objects.all(),
        source="recipe",
        write_only=True,
    )

    item_name = serializers.CharField(
        source="get_item_name",
        read_only=True,
    )
    weekday = serializers.CharField(
        source="get_weekday_display",
        read_only=True,
    )

    class Meta:
        model = MealPlanRecipe
        fields = [
            "id",
            "meal_plan",
            "meal",
            "recipe",
            "recipe_id",
            "day",
            "weekday",
            "serving_size",
            "number_of_servings",
            "item_name",
        ]
        extra_kwargs = {
            "meal_plan": {"required": False},
        }


class MealPlanSerializer(serializers.ModelSerializer):
    """
    Full read/write serializer for MealPlan.

    Foods and recipes are serialized using their own domain serializers.
    On write, food_id and recipe_id are used to reference existing objects.
    """

    foods = MealPlanFoodSerializer(
        many=True,
        required=False,
    )
    recipes = MealPlanRecipeSerializer(
        many=True,
        required=False,
    )
    tags = serializers.PrimaryKeyRelatedField(
        queryset=MealPlanTag.objects.all(),
        many=True,
        required=False,
    )

    start_day_display = serializers.CharField(
        source="get_start_day_display",
        read_only=True,
    )

    user = serializers.PrimaryKeyRelatedField(
        read_only=True,
    )

    class Meta:
        model = MealPlan
        fields = [
            "id",
            "name",
            "description",
            "user",
            "tags",
            "is_favorite",
            "start_day",
            "start_day_display",
            "created_at",
            "updated_at",
            "last_used_at",
            "foods",
            "recipes",
        ]
        read_only_fields = [
            "created_at",
            "updated_at",
            "last_used_at",
        ]

    def validate_tags(self, tags):
        user = self.context["request"].user

        if any(tag.user_id != user.id for tag in tags):
            raise serializers.ValidationError("You can only use your own tags.")

        return tags

    def create(self, validated_data):
        foods_data = validated_data.pop("foods", [])
        recipes_data = validated_data.pop("recipes", [])
        tags_data = validated_data.pop("tags", [])

        validated_data["user"] = self.context["request"].user

        meal_plan = MealPlan.objects.create(**validated_data)
        meal_plan.tags.set(tags_data)

        for food_data in foods_data:
            MealPlanFood.objects.create(
                meal_plan=meal_plan,
                **food_data,
            )

        for recipe_data in recipes_data:
            MealPlanRecipe.objects.create(
                meal_plan=meal_plan,
                **recipe_data,
            )

        return meal_plan

    def update(self, instance, validated_data):
        foods_data = validated_data.pop("foods", None)
        recipes_data = validated_data.pop("recipes", None)
        tags_data = validated_data.pop("tags", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if tags_data is not None:
            instance.tags.set(tags_data)

        if foods_data is not None:
            instance.foods.all().delete()

            for food_data in foods_data:
                MealPlanFood.objects.create(
                    meal_plan=instance,
                    **food_data,
                )

        if recipes_data is not None:
            instance.recipes.all().delete()

            for recipe_data in recipes_data:
                MealPlanRecipe.objects.create(
                    meal_plan=instance,
                    **recipe_data,
                )

        return instance


class MealPlanListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""

    start_day_display = serializers.CharField(
        source="get_start_day_display",
        read_only=True,
    )

    food_count = serializers.IntegerField(
        source="foods.count",
        read_only=True,
    )

    recipe_count = serializers.IntegerField(
        source="recipes.count",
        read_only=True,
    )

    class Meta:
        model = MealPlan
        fields = [
            "id",
            "name",
            "description",
            "tags",
            "is_favorite",
            "start_day",
            "start_day_display",
            "created_at",
            "updated_at",
            "last_used_at",
            "food_count",
            "recipe_count",
        ]
