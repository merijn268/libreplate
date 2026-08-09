from typing import Any

from apps.nutrients.models import Nutrient
from apps.nutrients.serializers import NutrientBriefSerializer
from apps.tags.serializers import TagSerializer
from apps.units.models import Unit
from apps.units.serializers import UnitBriefSerializer
from django.db import transaction
from rest_framework import serializers

from .models import Food, FoodNutrient, FoodTag


class FoodNutrientSerializer(serializers.ModelSerializer):
    nutrient = NutrientBriefSerializer(read_only=True)
    nutrient_id = serializers.PrimaryKeyRelatedField(
        queryset=Nutrient.objects.all(),
        source="nutrient",
        write_only=True,
    )

    class Meta:
        model = FoodNutrient
        fields = [
            "nutrient",
            "nutrient_id",
            "amount",
        ]


class FoodSerializer(serializers.ModelSerializer):
    unit = UnitBriefSerializer(read_only=True)
    unit_id = serializers.PrimaryKeyRelatedField(
        queryset=Unit.objects.all(),
        source="unit",
        write_only=True,
    )

    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=FoodTag.objects.all(),
        source="tags",
        write_only=True,
        required=False,
    )

    nutrients = FoodNutrientSerializer(
        source="food_nutrients",
        many=True,
        required=False,
    )

    external_source = serializers.CharField(
        required=False,
        allow_null=True,
    )
    external_id = serializers.CharField(
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Food
        fields = [
            "id",
            "name",
            "serving",
            "unit",
            "unit_id",
            "barcode",
            "brand",
            "description",
            "is_favorite",
            "external_source",
            "external_id",
            "tags",
            "tag_ids",
            "nutrients",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        request = self.context["request"]

        for tag in attrs.get("tags", []):
            if tag.user != request.user:
                raise serializers.ValidationError(
                    {"tag_ids": "You cannot use another user's tags."}
                )

        return attrs

    def _set_nutrients(
        self,
        food: Food,
        nutrients: list[dict[str, Any]],
    ) -> None:
        FoodNutrient.objects.filter(food=food).delete()

        FoodNutrient.objects.bulk_create(
            [
                FoodNutrient(
                    food=food,
                    nutrient=item["nutrient"],
                    amount=item["amount"],
                )
                for item in nutrients
            ]
        )

    @transaction.atomic
    def create(self, validated_data: dict[str, Any]) -> Food:
        nutrients = validated_data.pop("food_nutrients", [])
        tags = validated_data.pop("tags", [])

        food = Food.objects.create(**validated_data)
        food.tags.set(tags)
        self._set_nutrients(food, nutrients)

        return food

    @transaction.atomic
    def update(self, instance: Food, validated_data: dict[str, Any]) -> Food:
        nutrients = validated_data.pop("food_nutrients", None)
        tags = validated_data.pop("tags", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if tags is not None:
            instance.tags.set(tags)

        if nutrients is not None:
            self._set_nutrients(instance, nutrients)

        return instance
