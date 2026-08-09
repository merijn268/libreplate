from django import forms

from .models import Unit


class UnitForm(forms.ModelForm):
    class Meta:
        model = Unit
        fields = ["name", "abbreviation", "description"]
        widgets = {
            "description": forms.Textarea(attrs={"rows": 3}),
        }

    def __init__(self, *args, scope=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.scope = scope

    def save(self, commit=True):
        unit = super().save(commit=False)

        if self.scope is not None:
            unit.scope = self.scope

        if commit:
            unit.save()

        return unit
