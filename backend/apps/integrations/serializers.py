from apps.foods.serializers import FoodSerializer
from rest_framework import serializers


class IntegrationFoodSerializer(FoodSerializer):
    class Meta(FoodSerializer.Meta):
        fields = [
            *FoodSerializer.Meta.fields,
            "external_source",
            "external_id",
        ]


class FoodIntegrationAddSerializer(serializers.Serializer):
    service = serializers.ChoiceField(
        choices=[
            ("Dirk", "Dirk"),
            ("USDA", "USDA"),
        ],
    )
    external_id = serializers.CharField()
