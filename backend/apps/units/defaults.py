from .models import Unit

DEFAULT_UNITS = [
    Unit(
        name="Gram",
        abbreviation="g",
        description="SI unit of mass.",
        visible_in_nutrients=True,
        visible_in_foods=True,
    ),
    Unit(
        name="Kilogram",
        abbreviation="kg",
        description="SI unit of mass.",
        visible_in_body_metrics=True,
    ),
    Unit(
        name="Centimeter",
        abbreviation="cm",
        description="SI unit of length commonly used for body measurements.",
        visible_in_body_metrics=True,
    ),
    Unit(
        name="Milliliter",
        abbreviation="ml",
        description="SI unit of volume.",
        visible_in_nutrients=True,
        visible_in_foods=True,
    ),
    Unit(
        name="Liter",
        abbreviation="l",
        description="SI unit of volume.",
        visible_in_nutrients=True,
        visible_in_foods=True,
    ),
    Unit(
        name="Piece",
        abbreviation="",
        description="A piece of something.",
        visible_in_foods=True,
    ),
    Unit(
        name="Scoop",
        abbreviation="",
        description="A scoop of something.",
        visible_in_foods=True,
    ),
]
