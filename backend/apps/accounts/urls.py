from django.urls import path

from .api import (
    UserPreferencesView,
    csrf_view,
    login_view,
    logout_view,
    me_view,
)

urlpatterns = [
    path("csrf/", csrf_view, name="csrf"),
    path("login/", login_view, name="login"),
    path("logout/", logout_view, name="logout"),
    path("me/", me_view, name="me"),
    path(
        "preferences/",
        UserPreferencesView.as_view(),
        name="preferences",
    ),
]
