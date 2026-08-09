from django.apps import AppConfig


class RecipesConfig(AppConfig):
    # TODO primary keys should not be incremental
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.recipes"
