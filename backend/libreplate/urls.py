from django.conf import settings
from django.http import FileResponse
from django.urls import include, path, re_path
from django.views.static import serve
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)


class CustomSpectacularSwaggerView(SpectacularSwaggerView):
    swagger_ui_settings = {
        "withCredentials": True,
        "requestInterceptor": """
        function(request) {
            console.log("INTERCEPTOR RUNNING", request);

            const csrfCookie = document.cookie
                .split("; ")
                .find(row => row.startsWith("csrftoken="));

            if (csrfCookie) {
                const csrfToken = csrfCookie.split("=")[1];
                request.headers["X-CSRFToken"] = csrfToken;
            }

            request.credentials = "include";

            return request;
        }
        """,
    }


def react_app(request):
    return FileResponse((settings.FRONTEND_DIST / "index.html").open("rb"))


urlpatterns = [
    path("api/accounts/", include("apps.accounts.api_urls")),
    path("api/foods/", include("apps.foods.urls")),
    path("api/groceries/", include("apps.groceries.api_urls")),
    path("api/integrations/", include("apps.integrations.urls")),
    path("api/meals/", include("apps.meals.urls")),
    path("api/nutrients/", include("apps.nutrients.urls")),
    path("api/units/", include("apps.units.urls")),
    path("api/recipes/", include("apps.recipes.urls")),
    path("api/meal-plans/", include("apps.meal_plans.urls")),
]


if settings.DEBUG:
    urlpatterns += [
        path(
            "api/schema/",
            SpectacularAPIView.as_view(),
            name="schema",
        ),
        path(
            "api/docs/",
            CustomSpectacularSwaggerView.as_view(
                url_name="schema",
            ),
            name="swagger-ui",
        ),
        path(
            "api/redoc/",
            SpectacularRedocView.as_view(
                url_name="schema",
            ),
            name="redoc",
        ),
    ]


# React frontend assets
urlpatterns += [
    re_path(
        r"^assets/(?P<path>.*)$",
        serve,
        {
            "document_root": settings.FRONTEND_DIST / "assets",
        },
    ),
    re_path(
        r"^(?P<path>[^/]+\.(?:png|jpg|jpeg|svg|ico|webp|gif|txt))$",
        serve,
        {
            "document_root": settings.FRONTEND_DIST,
        },
    ),
    re_path(
        r"^favicon.ico$",
        serve,
        {
            "document_root": settings.FRONTEND_DIST,
            "path": "favicon.ico",
        },
    ),
    re_path(
        r"^(?!api/).*",
        react_app,
    ),
]
