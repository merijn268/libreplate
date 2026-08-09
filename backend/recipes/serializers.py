from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from tags.serializers import TagSerializer

from .models import Recipe, RecipeIngredient, RecipePicture, RecipeTag


class RecipeTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeTag
        fields = [
            "id",
            "name",
        ]


class RecipeIngredientSerializer(serializers.ModelSerializer):
    food_name = serializers.CharField(
        source="food.name",
        read_only=True,
    )

    class Meta:
        model = RecipeIngredient
        fields = [
            "id",
            "food",
            "food_name",
            "number_of_servings",
            "serving_amount",
            "order",
        ]

        read_only_fields = [
            "id",
            "food_name",
        ]


class RecipePictureSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipePicture
        fields = [
            "id",
        ]

        read_only_fields = [
            "id",
        ]


class RecipeNutrientSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    amount = serializers.FloatField()


class RecipeSerializer(serializers.ModelSerializer):
    nutrients = serializers.SerializerMethodField()

    has_picture = serializers.SerializerMethodField()

    tags = TagSerializer(
        many=True,
        read_only=True,
    )

    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=RecipeTag.objects.all(),
        source="tags",
        write_only=True,
        required=False,
    )

    ingredients = RecipeIngredientSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Recipe

        fields = (
            "id",
            "name",
            "is_favorite",
            "description",
            "instructions",
            "cooking_time",
            "prepping_time",
            "portions",
            "last_used_at",
            "created_at",
            "updated_at",
            "tags",
            "tag_ids",
            "has_picture",
            "ingredients",
            "nutrients",
        )

    def validate(self, attrs):
        request = self.context.get("request")

        if request and "tags" in attrs:
            for tag in attrs["tags"]:
                if tag.user != request.user:
                    raise serializers.ValidationError(
                        {"tag_ids": "You cannot use another user's tags."}
                    )

        return attrs

    @extend_schema_field(serializers.BooleanField)
    def get_has_picture(self, obj) -> bool:
        return hasattr(obj, "picture")

    @extend_schema_field(RecipeNutrientSerializer(many=True))
    def get_nutrients(self, obj):
        nutrients = obj.get_nutrients()

        return [
            {
                "id": nutrient.id,
                "name": nutrient.name,
                "amount": amount,
            }
            for nutrient, amount in nutrients.items()
        ]
