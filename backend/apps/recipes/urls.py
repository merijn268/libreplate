from django.urls import path

from .api import (
    RecipeIngredientViewSet,
    RecipePictureViewSet,
    RecipeTagViewSet,
    RecipeViewSet,
)

recipe_list = RecipeViewSet.as_view(
    {
        "get": "list",
        "post": "create",
    }
)

recipe_detail = RecipeViewSet.as_view(
    {
        "get": "retrieve",
        "put": "update",
        "patch": "partial_update",
        "delete": "destroy",
    }
)

toggle_favorite = RecipeViewSet.as_view(
    {
        "post": "toggle_favorite",
    }
)

recipe_copy = RecipeViewSet.as_view(
    {
        "post": "copy",
    }
)

tag_list = RecipeTagViewSet.as_view(
    {
        "get": "list",
        "post": "create",
    }
)

tag_detail = RecipeTagViewSet.as_view(
    {
        "put": "update",
        "patch": "partial_update",
        "delete": "destroy",
    }
)

recipe_ingredients = RecipeIngredientViewSet.as_view(
    {
        "get": "list",
        "post": "create",
    }
)

recipe_ingredient_detail = RecipeIngredientViewSet.as_view(
    {
        "get": "retrieve",
        "put": "update",
        "patch": "partial_update",
        "delete": "destroy",
    }
)

recipe_picture = RecipePictureViewSet.as_view(
    {
        "get": "retrieve",
        "post": "create",
        "delete": "destroy",
    }
)


urlpatterns = [
    path(
        "",
        recipe_list,
        name="recipe-list",
    ),
    # Tags
    path(
        "tags/",
        tag_list,
        name="recipe-tag-list",
    ),
    path(
        "tags/<int:pk>/",
        tag_detail,
        name="recipe-tag-detail",
    ),
    # Recipes
    path(
        "<int:pk>/",
        recipe_detail,
        name="recipe-detail",
    ),
    path(
        "<int:pk>/toggle-favorite/",
        toggle_favorite,
        name="recipe-toggle-favorite",
    ),
    path(
        "<int:pk>/copy/",
        recipe_copy,
        name="recipe-copy",
    ),
    # Ingredients
    path(
        "<int:pk>/ingredients/",
        recipe_ingredients,
        name="recipe-ingredients",
    ),
    path(
        "<int:pk>/ingredients/<int:ingredient_pk>/",
        recipe_ingredient_detail,
        name="recipe-ingredient-detail",
    ),
    # Picture
    path(
        "<int:pk>/picture/",
        recipe_picture,
        name="recipe-picture",
    ),
]
