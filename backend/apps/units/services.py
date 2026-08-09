from django.forms.models import model_to_dict

from .defaults import DEFAULT_UNITS
from .models import Unit


def sync_default_units(overwrite=False):
    operation = (
        Unit.objects.update_or_create if overwrite else Unit.objects.get_or_create
    )

    for unit in DEFAULT_UNITS:
        operation(
            name=unit.name,
            user=None,
            defaults=model_to_dict(
                unit,
                exclude={"id", "name", "user"},
            ),
        )
