from datetime import timedelta

from django import forms
from django.utils import timezone

from .models import GroceryList


class GroceryListCreateForm(forms.ModelForm):
    class Meta:
        model = GroceryList

        fields = [
            "date_start",
            "date_end",
            "name",
        ]

        widgets = {
            "date_start": forms.DateInput(attrs={"type": "date"}),
            "date_end": forms.DateInput(attrs={"type": "date"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        tomorrow = timezone.localdate() + timedelta(days=1)

        self.fields["date_start"].initial = tomorrow
        self.fields["date_end"].initial = tomorrow + timedelta(days=7)
