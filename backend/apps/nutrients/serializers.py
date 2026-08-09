from rest_framework import serializers

from .models import Nutrient


class NutrientBriefSerializer(serializers.ModelSerializer):
    """
    A compact nutrient representation.
    """

    class Meta:
        model = Nutrient

        # TODO Unit should be a nested nutrient serializer, not a string.
        # Or at LEAST, it should be flattened.
        fields = ["id", "name", "unit"]


class NutrientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Nutrient
        fields = [
            "id",
            "name",
            "description",
            "abbreviation",
            "unit",
            "usda_nutrient_number",
            "order",
            "show_in_diary_total",
            "show_in_diary_meal",
            "show_in_food_edit",
            "show_in_recipe",
            "show_in_recipes",
            "show_in_foods",
            "show_in_goal_edit",
        ]
        read_only_fields = fields
