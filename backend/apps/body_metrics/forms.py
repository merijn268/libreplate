# body_metrics/forms.py
from django import forms

from .models import BodyMetric


class BodyMetricForm(forms.ModelForm):
    class Meta:
        model = BodyMetric
        fields = [
            "name",
            "description",
            "show_in_diary_total",
            "show_in_goal_edit",
            "is_single_entry",
        ]

        widgets = {
            "description": forms.Textarea(attrs={"rows": 3}),
        }
