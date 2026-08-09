from .defaults import DEFAULT_NUTRIENTS
from .models import Nutrient


def sync_default_nutrients(overwrite=False):
    operation = (
        Nutrient.objects.update_or_create
        if overwrite
        else Nutrient.objects.get_or_create
    )

    for nutrient in DEFAULT_NUTRIENTS:
        operation(
            name=nutrient.name,
            defaults=nutrient.model_dump(exclude={"name"}),
        )
