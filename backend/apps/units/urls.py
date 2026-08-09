from django.urls import path

from .api import UnitListAPI

urlpatterns = [
    # TODO user should be able to make his own units, or hide existing ones...
    path("", UnitListAPI.as_view(), name="units"),
]
