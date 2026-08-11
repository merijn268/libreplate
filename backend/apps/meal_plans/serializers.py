import calendar

from apps.foods.models import Food
from apps.meals.models import DefaultMeal
from apps.recipes.models import Recipe
from rest_framework import serializers

from .models import (
    MealPlan,
    MealPlanTag,
    PlannedMeal,
    PlannedMealEntryRecurrence,
    PlannedMealFood,
    PlannedMealRecipe,
)


class PlannedMealEntryRecurrenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlannedMealEntryRecurrence
        fields = [
            "interval_count",
            "interval",
            "weekdays",
            "end",
            "end_day",
            "end_after",
        ]


class PlannedMealFoodSerializer(serializers.ModelSerializer):

    planned_meal_id = serializers.PrimaryKeyRelatedField(
        queryset=PlannedMeal.objects.all(),
        source="planned_meal",
    )
    food_id = serializers.PrimaryKeyRelatedField(
        queryset=Food.objects.all(),
        source="food",
    )
    food_name = serializers.CharField(
        source="food.name",
        read_only=True,
    )
    recurrence = PlannedMealEntryRecurrenceSerializer(
        required=False,
    )

    class Meta:
        model = PlannedMealFood
        fields = [
            "id",
            "planned_meal_id",
            "food_id",
            "food_name",
            "serving_size",
            "number_of_servings",
            "recurrence",
        ]

    def create(self, validated_data):
        recurrence_data = validated_data.pop(
            "recurrence",
            None,
        )

        entry = PlannedMealFood.objects.create(
            **validated_data,
        )

        if recurrence_data is not None:
            PlannedMealEntryRecurrence.objects.create(
                planned_meal_entry=entry,
                **recurrence_data,
            )

        return entry



class PlannedMealRecipeSerializer(serializers.ModelSerializer):
    recipe_id = serializers.PrimaryKeyRelatedField(
        queryset=Recipe.objects.all(),
        source="recipe",
    )
    recipe_name = serializers.CharField(
        source="recipe.name",
        read_only=True,
    )
    recurrence = PlannedMealEntryRecurrenceSerializer(
        required=False,
    )

    class Meta:
        model = PlannedMealRecipe
        fields = [
            "id",
            "recipe_id",
            "recipe_name",
            "number_of_servings",
            "recurrence",
        ]

    def create(self, validated_data):
        recurrence_data = validated_data.pop(
            "recurrence",
            None,
        )

        planned_meal = self.context["planned_meal"]

        entry = PlannedMealRecipe.objects.create(
            planned_meal=planned_meal,
            **validated_data,
        )

        if recurrence_data is not None:
            PlannedMealEntryRecurrence.objects.create(
                planned_meal_entry=entry,
                **recurrence_data,
            )

        return entry


class PlannedMealSerializer(serializers.ModelSerializer):
    foods = PlannedMealFoodSerializer(
        many=True,
        required=False,
    )
    recipes = PlannedMealRecipeSerializer(
        many=True,
        required=False,
    )
    weekday = serializers.SerializerMethodField()

    class Meta:
        model = PlannedMeal
        fields = [
            "id",
            "name",
            "order",
            "day",
            "weekday",
            "foods",
            "recipes",
        ]

    def get_weekday(self, obj) -> str:
        return calendar.day_name[obj.get_weekday()]

    def _create_food_entries(
        self,
        planned_meal,
        foods_data,
    ):
        for food_data in foods_data:
            food_data = food_data.copy()

            recurrence_data = food_data.pop(
                "recurrence",
                None,
            )

            entry = PlannedMealFood.objects.create(
                planned_meal=planned_meal,
                **food_data,
            )

            if recurrence_data is not None:
                PlannedMealEntryRecurrence.objects.create(
                    planned_meal_entry=entry,
                    **recurrence_data,
                )

    def _create_recipe_entries(
        self,
        planned_meal,
        recipes_data,
    ):
        for recipe_data in recipes_data:
            recipe_data = recipe_data.copy()

            recurrence_data = recipe_data.pop(
                "recurrence",
                None,
            )

            entry = PlannedMealRecipe.objects.create(
                planned_meal=planned_meal,
                **recipe_data,
            )

            if recurrence_data is not None:
                PlannedMealEntryRecurrence.objects.create(
                    planned_meal_entry=entry,
                    **recurrence_data,
                )

    def create(self, validated_data):
        foods_data = validated_data.pop(
            "foods",
            [],
        )
        recipes_data = validated_data.pop(
            "recipes",
            [],
        )

        planned_meal = PlannedMeal.objects.create(
            **validated_data,
        )

        self._create_food_entries(
            planned_meal,
            foods_data,
        )

        self._create_recipe_entries(
            planned_meal,
            recipes_data,
        )

        return planned_meal

    def update(self, instance, validated_data):
        foods_data = validated_data.pop(
            "foods",
            None,
        )
        recipes_data = validated_data.pop(
            "recipes",
            None,
        )

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if foods_data is not None:
            instance.entries.all().delete()

            self._create_food_entries(
                instance,
                foods_data,
            )

            self._create_recipe_entries(
                instance,
                recipes_data if recipes_data is not None else [],
            )

        elif recipes_data is not None:
            instance.entries.all().delete()

            self._create_food_entries(
                instance,
                [],
            )

            self._create_recipe_entries(
                instance,
                recipes_data,
            )

        return instance


class MealPlanSerializer(serializers.ModelSerializer):
    planned_meals = PlannedMealSerializer(
        many=True,
        required=False,
    )
    tags = serializers.PrimaryKeyRelatedField(
        queryset=MealPlanTag.objects.all(),
        many=True,
        required=False,
    )
    start_day_display = serializers.SerializerMethodField()
    user = serializers.PrimaryKeyRelatedField(
        read_only=True,
    )

    class Meta:
        model = MealPlan
        fields = [
            "id",
            "name",
            "description",
            "start_day",
            "start_day_display",
            "duration",
            "duration_period",
            "user",
            "tags",
            "is_favorite",
            "created_at",
            "updated_at",
            "last_used_at",
            "planned_meals",
        ]
        read_only_fields = [
            "created_at",
            "updated_at",
            "last_used_at",
            "user",
        ]

    def get_start_day_display(self, obj) -> str:
        return calendar.day_name[obj.start_day]

    def _populate_default_meals(self, meal_plan):
        """
        Return persisted PlannedMeals plus virtual PlannedMeals generated
        from the user's DefaultMeals.

        Virtual meals are never saved to the database.
        """
        planned_meals = list(meal_plan.planned_meals.all())

        default_meals = list(
            DefaultMeal.objects.filter(
                user=meal_plan.user,
            ).order_by("order", "id")
        )

        if not default_meals:
            return planned_meals

        existing = {
            (planned_meal.day, planned_meal.name) for planned_meal in planned_meals
        }

        duration_days = (
            meal_plan.duration * 7
            if meal_plan.duration_period == "week"
            else meal_plan.duration
        )

        for day in range(duration_days):
            for default_meal in default_meals:
                key = (day, default_meal.name)

                if key in existing:
                    continue

                planned_meals.append(
                    PlannedMeal(
                        meal_plan=meal_plan,
                        day=day,
                        name=default_meal.name,
                        order=default_meal.order,
                    )
                )

                existing.add(key)

        return planned_meals

    def to_representation(self, instance):
        planned_meals = self._populate_default_meals(instance)

        representation = super().to_representation(instance)

        representation["planned_meals"] = PlannedMealSerializer(
            planned_meals,
            many=True,
            context=self.context,
        ).data

        return representation

    def validate_tags(self, tags):
        user = self.context["request"].user

        if any(tag.user_id != user.id for tag in tags):
            raise serializers.ValidationError("You can only use your own tags.")

        return tags

    def _create_planned_meal(
        self,
        meal_plan,
        planned_meal_data,
    ):
        planned_meal_data = planned_meal_data.copy()

        foods_data = planned_meal_data.pop(
            "foods",
            [],
        )
        recipes_data = planned_meal_data.pop(
            "recipes",
            [],
        )

        planned_meal = PlannedMeal.objects.create(
            meal_plan=meal_plan,
            **planned_meal_data,
        )

        serializer = PlannedMealSerializer(
            context=self.context,
        )

        serializer._create_food_entries(
            planned_meal,
            foods_data,
        )

        serializer._create_recipe_entries(
            planned_meal,
            recipes_data,
        )

        return planned_meal

    def create(self, validated_data):
        planned_meals_data = validated_data.pop(
            "planned_meals",
            [],
        )
        tags_data = validated_data.pop(
            "tags",
            [],
        )

        validated_data["user"] = self.context["request"].user

        meal_plan = MealPlan.objects.create(
            **validated_data,
        )

        meal_plan.tags.set(tags_data)

        for planned_meal_data in planned_meals_data:
            self._create_planned_meal(
                meal_plan,
                planned_meal_data,
            )

        return meal_plan

    def update(self, instance, validated_data):
        planned_meals_data = validated_data.pop(
            "planned_meals",
            None,
        )
        tags_data = validated_data.pop(
            "tags",
            None,
        )

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if tags_data is not None:
            instance.tags.set(tags_data)

        if planned_meals_data is not None:
            instance.planned_meals.all().delete()

            for planned_meal_data in planned_meals_data:
                self._create_planned_meal(
                    instance,
                    planned_meal_data,
                )

        return instance


class MealPlanListSerializer(serializers.ModelSerializer):
    start_day_display = serializers.SerializerMethodField()

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
            "duration",
            "duration_period",
            "created_at",
            "updated_at",
            "last_used_at",
        ]

    def get_start_day_display(self, obj) -> str:
        return calendar.day_name[obj.start_day]

    def get_food_count(self, obj) -> int:
        return PlannedMealFood.objects.filter(
            planned_meal__meal_plan=obj,
        ).count()

    def get_recipe_count(self, obj) -> int:
        return PlannedMealRecipe.objects.filter(
            planned_meal__meal_plan=obj,
        ).count()
