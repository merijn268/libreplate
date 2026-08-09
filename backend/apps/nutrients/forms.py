from django import forms

from .models import Nutrient


class NutrientForm(forms.ModelForm):
    class Meta:
        model = Nutrient
        fields = [
            "name",
            "abbreviation",
            "description",
            "show_in_diary_total",
            "show_in_diary_meal",
            "show_in_food_edit",
            "show_in_recipe",
            "show_in_foods",
            "show_in_goal_edit",
            "usda_nutrient_number",
        ]

        widgets = {
            "description": forms.Textarea(attrs={"rows": 3}),
        }
