from rest_framework import serializers

from .models import Unit


class UnitBriefSerializer(serializers.ModelSerializer):
    """
    A compact unit representation.
    """

    class Meta:
        model = Unit
        fields = ["id", "name", "abbreviation"]


# TODO: In the future, split off visibility into a visibility class.
# This is quite messy.
class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = [
            "id",
            "name",
            "description",
            "abbreviation",
            "visible_in_nutrients",
            "visible_in_body_metrics",
            "visible_in_foods",
        ]
