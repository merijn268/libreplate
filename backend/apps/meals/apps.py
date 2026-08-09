from django.apps import AppConfig


class MealsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.meals"

    def ready(self):
        import apps.meals.signals  # noqa: F401
