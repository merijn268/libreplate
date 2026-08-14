import calendar
from typing import Any

from apps.core.serializers import UserOwnedRelatedField
from apps.foods.models import Food
from apps.foods.serializers import FoodSerializer
from apps.meals.models import DefaultMeal
from apps.recipes.models import Recipe
from apps.recipes.serializers import RecipeSerializer
from apps.tags.serializers import TagSerializer
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


class PlannedMealEntrySerializer(serializers.ModelSerializer):
    planned_meal_id = serializers.PrimaryKeyRelatedField(
        queryset=PlannedMeal.objects.all(),
        source="planned_meal",
    )
    recurrence = PlannedMealEntryRecurrenceSerializer(
        required=False,
        allow_null=True,
    )

    def create(self, validated_data: dict[str, Any]):
        recurrence_data = validated_data.pop("recurrence", None)

        entry = super().create(validated_data)

        if recurrence_data is not None:
            PlannedMealEntryRecurrence.objects.create(
                planned_meal_entry=entry,
                **recurrence_data,
            )

        return entry

    def update(
        self,
        instance,
        validated_data: dict[str, Any],
    ):
        recurrence_data = validated_data.pop(
            "recurrence",
            serializers.empty,
        )

        instance = super().update(
            instance,
            validated_data,
        )

        if recurrence_data is not serializers.empty:
            if recurrence_data is None:
                PlannedMealEntryRecurrence.objects.filter(
                    planned_meal_entry=instance,
                ).delete()
            else:
                recurrence, _ = PlannedMealEntryRecurrence.objects.update_or_create(
                    planned_meal_entry=instance,
                    defaults=recurrence_data,
                )

        return instance


class PlannedMealFoodSerializer(PlannedMealEntrySerializer):
    food_id = serializers.PrimaryKeyRelatedField(
        queryset=Food.objects.all(),
        source="food",
    )
    food = FoodSerializer(read_only=True)

    class Meta:
        model = PlannedMealFood
        fields = [
            "id",
            "planned_meal_id",
            "food_id",
            "food",
            "serving_size",
            "number_of_servings",
            "recurrence",
        ]


class PlannedMealRecipeSerializer(PlannedMealEntrySerializer):
    recipe_id = serializers.PrimaryKeyRelatedField(
        queryset=Recipe.objects.all(),
        source="recipe",
    )
    recipe = RecipeSerializer(read_only=True)

    class Meta:
        model = PlannedMealRecipe
        fields = [
            "id",
            "planned_meal_id",
            "recipe_id",
            "recipe",
            "number_of_servings",
            "recurrence",
        ]


class PlannedMealSerializer(serializers.ModelSerializer):
    foods = PlannedMealFoodSerializer(many=True, required=False)
    recipes = PlannedMealRecipeSerializer(many=True, required=False)
    weekday = serializers.SerializerMethodField()
    is_virtual = serializers.SerializerMethodField()

    # Only needed when creating/updating a PlannedMeal directly through the
    # flat /planned-meals/ endpoint. When PlannedMealSerializer is used as
    # a nested field on MealPlanSerializer, the parent meal plan is already
    # known and assigned explicitly, so this stays optional here and its
    # absence is instead enforced in create() below.
    meal_plan_id = serializers.PrimaryKeyRelatedField(
        queryset=MealPlan.objects.all(),
        source="meal_plan",
        write_only=True,
        required=False,
    )

    class Meta:
        model = PlannedMeal
        fields = [
            "id",
            "is_virtual",
            "meal_plan_id",
            "name",
            "order",
            "day",
            "weekday",
            "foods",
            "recipes",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get("request")
        user = getattr(request, "user", None)

        # Schema generators (e.g. drf-spectacular) instantiate serializers
        # with a fake, unauthenticated request to introspect fields, so
        # `user` can be an AnonymousUser here rather than a real User -
        # which isn't a valid value to filter a FK by. Fall back to an
        # empty queryset in that case; real requests are always
        # authenticated because of the view's IsAuthenticated permission.
        if user is not None and user.is_authenticated:
            self.fields["meal_plan_id"].queryset = MealPlan.objects.filter(
                user=user,
            )
        else:
            self.fields["meal_plan_id"].queryset = MealPlan.objects.none()

    def get_is_virtual(self, obj) -> bool:
        return obj.pk is None

    def get_weekday(self, obj) -> str:
        return calendar.day_name[obj.get_weekday()]

    def _create_food_entries(
        self,
        planned_meal: PlannedMeal,
        foods_data: list[dict[str, Any]],
    ) -> None:

        for food_data in foods_data:
            food_data = food_data.copy()
            recurrence_data = food_data.pop(key="recurrence", default=None)

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
        planned_meal: PlannedMeal,
        recipes_data: list[dict[str, Any]],
    ) -> None:

        for recipe_data in recipes_data:
            recipe_data = recipe_data.copy()

            recurrence_data = recipe_data.pop(
                key="recurrence",
                default=None,
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

    def create(self, validated_data: dict[str, Any]) -> PlannedMeal:
        """
        Create a planned meal and its associated food and recipe entries.
        """
        if "meal_plan" not in validated_data:
            raise serializers.ValidationError(
                {"meal_plan_id": "This field is required."}
            )

        foods_data = validated_data.pop("foods", [])
        recipes_data = validated_data.pop("recipes", [])
        planned_meal = PlannedMeal.objects.create(**validated_data)
        self._create_food_entries(planned_meal, foods_data)
        self._create_recipe_entries(planned_meal, recipes_data)
        return planned_meal

    def update(
        self,
        instance: PlannedMeal,
        validated_data: dict[str, Any],
    ) -> PlannedMeal:
        """
        Update a planned meal and its associated food and recipe entries.
        """
        foods_data = validated_data.pop(key="foods", default=None)
        recipes_data = validated_data.pop(key="recipes", default=None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if foods_data is not None:
            PlannedMealFood.objects.filter(planned_meal=instance).delete()
            self._create_food_entries(instance, foods_data)

        if recipes_data is not None:
            PlannedMealRecipe.objects.filter(planned_meal=instance).delete()
            self._create_recipe_entries(instance, recipes_data)

        return instance


class MealPlanApplySerializer(serializers.Serializer):
    """Input for MealPlanViewSet.apply()."""

    start_date = serializers.DateField()
    days = serializers.IntegerField(
        min_value=1,
        max_value=MealPlan.MAX_APPLY_DAYS,
        default=MealPlan.MAX_APPLY_DAYS,
        required=False,
    )


class MealPlanSerializer(serializers.ModelSerializer):
    """
    Full meal-plan representation.

    ``planned_meals`` contains both persisted PlannedMeal instances and
    virtual PlannedMeal instances generated from the user's DefaultMeals.

    Virtual planned meals:
    - are not saved to the database;
    - have ``id=None``;
    - are generated for missing default meals within the meal plan's duration;
    - cannot be addressed through the PlannedMeal CRUD endpoints until they
      have been persisted.

    """

    # TODO virtual meals are a messy design choice.

    planned_meals = PlannedMealSerializer(many=True, required=False)

    # TODO Try out if this validation actually helps with readability.
    # Than apply to all code
    tags = UserOwnedRelatedField(
        queryset=MealPlanTag.objects.all(),
        serializer_class=TagSerializer,
        many=True,
        required=False,
    )
    start_day_display = serializers.SerializerMethodField()
    user = serializers.PrimaryKeyRelatedField(read_only=True)

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
            "is_active",
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
            "is_active",
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

    def to_representation(self, instance: MealPlan) -> dict[str, Any]:
        """
        Serialize the meal plan with populated default planned meals.
        """
        representation = super().to_representation(instance=instance)
        planned_meals = self._populate_default_meals(meal_plan=instance)

        representation["planned_meals"] = PlannedMealSerializer(
            instance=planned_meals,
            many=True,
            context=self.context,
        ).data

        return representation

    def _create_planned_meal(
        self,
        meal_plan: MealPlan,
        planned_meal_data: dict[str, Any],
    ) -> PlannedMeal:
        """
        Create a planned meal and its associated food and recipe entries.
        """
        planned_meal_data = planned_meal_data.copy()
        foods_data = planned_meal_data.pop(key="foods", default=[])
        recipes_data = planned_meal_data.pop(key="recipes", default=[])
        planned_meal = PlannedMeal.objects.create(
            meal_plan=meal_plan,
            **planned_meal_data,
        )
        serializer = PlannedMealSerializer(context=self.context)
        serializer._create_food_entries(planned_meal, foods_data)
        serializer._create_recipe_entries(planned_meal, recipes_data)
        return planned_meal

    def create(self, validated_data: dict[str, Any]) -> MealPlan:
        planned_meals_data = validated_data.pop("planned_meals", [])
        tags_data = validated_data.pop("tags", [])

        validated_data["user"] = self.context["request"].user

        meal_plan = MealPlan.objects.create(**validated_data)

        for tag_data in tags_data:
            tag = MealPlanTag.objects.create(
                user=meal_plan.user,
                **tag_data,
            )
            meal_plan.tags.add(tag)

        for planned_meal_data in planned_meals_data:
            self._create_planned_meal(
                meal_plan,
                planned_meal_data,
            )

        return meal_plan

    def update(
        self,
        instance: MealPlan,
        validated_data: dict[str, Any],
    ) -> MealPlan:
        planned_meals_data = validated_data.pop("planned_meals", None)
        tags_data = validated_data.pop("tags", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if tags_data is not None:
            instance.tags.clear()

            for tag_data in tags_data:
                tag = MealPlanTag.objects.create(
                    user=instance.user,
                    **tag_data,
                )
                instance.tags.add(tag)

        if planned_meals_data is not None:
            instance.planned_meals.all().delete()

            for planned_meal_data in planned_meals_data:
                self._create_planned_meal(
                    instance,
                    planned_meal_data,
                )

        return instance


class MealPlanMinimalSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for meal plans, excluding planned meals and
    other fields.

    Used for the meal plan list endpoint and when displaying meal plans.
    """

    class Meta:
        model = MealPlan
        fields = [
            "id",
            "name",
            "description",
            "tags",
            "is_active",
            "is_favorite",
            "created_at",
            "updated_at",
            "last_used_at",
        ]
        read_only_fields = [
            "id",
            "is_active",
        ]
