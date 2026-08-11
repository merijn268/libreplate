from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent

env = environ.Env(
    DEBUG=(bool, False),
)

# Load environment variables from the project root.
environ.Env.read_env(PROJECT_ROOT / ".env")

SECRET_KEY = env("SECRET_KEY")
DEBUG = env("DEBUG")

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[])


# Application definition

INSTALLED_APPS = [
    "corsheaders",
    "django_htmx",
    "drf_spectacular",
    "rest_framework",
    "apps.foods.apps.FoodsConfig",
    "apps.meal_plans.apps.MealPlansConfig",
    "apps.units.apps.UnitsConfig",
    "apps.nutrients.apps.NutrientsConfig",
    "apps.groceries.apps.GroceriesConfig",
    "apps.accounts.apps.AccountsConfig",
    "apps.recipes.apps.RecipesConfig",
    "apps.core.apps.CoreConfig",
    "apps.meals.apps.MealsConfig",
    "apps.integrations.apps.IntegrationsConfig",
    "apps.body_metrics.apps.BodyMetricsConfig",
    "apps.goals.apps.GoalsConfig",
    "apps.user_statistics.apps.UserStatisticsConfig",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]


MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django_htmx.middleware.HtmxMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.db.DatabaseCache",
        "LOCATION": "django_cache",
    },
}


ROOT_URLCONF = "libreplate.urls"


TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


WSGI_APPLICATION = "libreplate.wsgi.application"


DATABASES = {
    "default": env.db("DATABASE_URL"),
}


AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": ("django.contrib.auth.password_validation.MinimumLengthValidator"),
    },
    {
        "NAME": ("django.contrib.auth.password_validation.CommonPasswordValidator"),
    },
    {
        "NAME": ("django.contrib.auth.password_validation.NumericPasswordValidator"),
    },
]


LANGUAGE_CODE = "en-us"

TIME_ZONE = "CET"

USE_I18N = True
USE_L10N = True
USE_TZ = True


# Static & media

FRONTEND_DIST = Path(env("FRONTEND_DIST"))

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

STATICFILES_DIRS = [
    FRONTEND_DIST,
]

MEDIA_URL = "/media/"
MEDIA_ROOT = Path(env("MEDIA_ROOT"))

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {name} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "LibrePlate": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}


CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://libreplate.alwaysdata.net",
]

CORS_ALLOW_CREDENTIALS = True


CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "https://libreplate.alwaysdata.net",
]


REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}


SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG


SPECTACULAR_SETTINGS = {
    "TITLE": "LibrePlate API",
    "VERSION": "0.0.0",
    # TODO overwritting Enums in settings file is ugly. Without this it gives
    # a warning `encountered multiple names for the same choice set
    # (IntervalEnum).`
    "ENUM_NAME_OVERRIDES": {
        "MealPlanPeriodUnitEnum": "apps.meal_plans.models.MealPlanPeriodUnit",
    },
    "APPEND_COMPONENTS": {
        "securitySchemes": {
            "cookieAuth": {
                "type": "apiKey",
                "in": "cookie",
                "name": "sessionid",
            },
        },
    },
    "SWAGGER_UI_SETTINGS": {
        "withCredentials": True,
        "requestInterceptor": """
function(request) {
    console.log("INTERCEPTOR RUNNING", request);

    const csrf = document.cookie
        .split("; ")
        .find(row => row.startsWith("csrftoken="));

    if (csrf) {
        request.headers["X-CSRFToken"] = csrf.split("=")[1];
    }

    request.credentials = "include";

    return request;
}
""",
    },
}
