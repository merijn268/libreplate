import pytest
from apps.accounts.models import UserPreferences
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
def test_fetch_and_set_user_preference(
    authenticated_client,
    create_user,
):
    client, user = authenticated_client

    preferences_url = reverse("preferences")

    other_user = create_user(username="other_user")

    other_preferences = UserPreferences.objects.create(
        user=other_user,
        theme_color="#FF0000",
    )

    response = client.get(preferences_url)

    assert response.status_code == status.HTTP_200_OK

    old_color = response.data["theme_color"]

    preferences = UserPreferences.objects.get(user=user)

    assert preferences.user_id == user.id
    assert preferences.theme_color == old_color
    assert old_color != other_preferences.theme_color

    new_color = "#123456"

    response = client.patch(
        preferences_url,
        {
            "theme_color": new_color,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["theme_color"] == new_color
    assert response.data["theme_color"] != old_color

    preferences.refresh_from_db()

    assert preferences.user_id == user.id
    assert preferences.theme_color == new_color

    other_preferences.refresh_from_db()

    assert other_preferences.user_id == other_user.id
    assert other_preferences.theme_color == "#FF0000"
