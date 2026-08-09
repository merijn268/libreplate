import mimetypes

from django.http import FileResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Recipe, RecipeIngredient, RecipePicture, RecipeTag
from .serializers import (
    RecipeIngredientSerializer,
    RecipePictureSerializer,
    RecipeSerializer,
    RecipeTagSerializer,
)


class RecipeViewSet(viewsets.ModelViewSet):
    authentication_classes = [SessionAuthentication]

    permission_classes = [IsAuthenticated]

    serializer_class = RecipeSerializer

    def get_queryset(self):
        return (
            Recipe.objects.filter(user=self.request.user)
            .prefetch_related(
                "tags",
                "ingredients__food",
            )
            .select_related(
                "picture",
            )
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def toggle_favorite(self, request, pk=None):
        recipe = self.get_object()

        recipe.is_favorite = not recipe.is_favorite

        recipe.save(
            update_fields=[
                "is_favorite",
                "updated_at",
            ]
        )

        return Response(
            {
                "id": recipe.id,
                "is_favorite": recipe.is_favorite,
            }
        )

    @action(detail=True, methods=["post"])
    def copy(self, request, pk=None):
        recipe = self.get_object()

        new_name = request.data.get("name")

        if not new_name:
            return Response(
                {"name": "This field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_recipe = Recipe.objects.create(
            user=request.user,
            name=new_name,
            description=recipe.description,
            instructions=recipe.instructions,
            cooking_time=recipe.cooking_time,
            prepping_time=recipe.prepping_time,
            portions=recipe.portions,
            last_used_at=timezone.now(),
        )

        for ingredient in recipe.ingredients.all():
            RecipeIngredient.objects.create(
                recipe=new_recipe,
                food=ingredient.food,
                number_of_servings=ingredient.number_of_servings,
                serving_amount=ingredient.serving_amount,
                order=ingredient.order,
            )

        new_recipe.tags.set(recipe.tags.all())

        if hasattr(recipe, "picture"):
            RecipePicture.objects.create(
                recipe=new_recipe,
                image=recipe.picture.image,
            )

        return Response(
            self.get_serializer(new_recipe).data,
            status=status.HTTP_201_CREATED,
        )


class RecipeTagViewSet(viewsets.ModelViewSet):
    authentication_classes = [SessionAuthentication]

    permission_classes = [IsAuthenticated]

    serializer_class = RecipeTagSerializer

    def get_queryset(self):
        return RecipeTag.objects.filter(
            user=self.request.user,
        )

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
        )


class RecipeIngredientViewSet(viewsets.ModelViewSet):
    authentication_classes = [SessionAuthentication]

    permission_classes = [IsAuthenticated]

    serializer_class = RecipeIngredientSerializer

    def get_recipe(self):
        return Recipe.objects.get(
            id=self.kwargs["pk"],
            user=self.request.user,
        )

    def get_queryset(self):
        recipe = self.get_recipe()

        return RecipeIngredient.objects.filter(recipe=recipe).select_related("food")

    def get_object(self):
        return RecipeIngredient.objects.get(
            id=self.kwargs["ingredient_pk"],
            recipe=self.get_recipe(),
        )

    def perform_create(self, serializer):
        serializer.save(
            recipe=self.get_recipe(),
        )


class RecipePictureViewSet(viewsets.ViewSet):
    authentication_classes = [SessionAuthentication]

    permission_classes = [IsAuthenticated]

    parser_classes = [
        MultiPartParser,
        FormParser,
    ]

    serializer_class = RecipePictureSerializer

    def get_recipe(self):
        return Recipe.objects.get(
            id=self.kwargs["pk"],
            user=self.request.user,
        )

    def retrieve(self, request, pk=None):
        try:
            picture = RecipePicture.objects.get(
                recipe=self.get_recipe(),
            )

        except RecipePicture.DoesNotExist:
            return Response(
                status=status.HTTP_404_NOT_FOUND,
            )

        content_type, _ = mimetypes.guess_type(
            picture.image.name,
        )

        return FileResponse(
            picture.image.open("rb"),
            content_type=content_type or "application/octet-stream",
        )

    def create(self, request, pk=None):
        recipe = self.get_recipe()

        picture, created = RecipePicture.objects.get_or_create(
            recipe=recipe,
        )

        serializer = RecipePictureSerializer(
            picture,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        serializer.save(
            recipe=recipe,
        )

        return Response(
            {
                "id": picture.id,
            },
            status=(status.HTTP_201_CREATED if created else status.HTTP_200_OK),
        )

    def destroy(self, request, pk=None):
        try:
            picture = RecipePicture.objects.get(
                recipe=self.get_recipe(),
            )

        except RecipePicture.DoesNotExist:
            return Response(
                status=status.HTTP_404_NOT_FOUND,
            )

        picture.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT,
        )
