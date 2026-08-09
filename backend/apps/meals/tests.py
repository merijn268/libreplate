import pytest
from django.urls import reverse


@pytest.mark.django_db
def test_user_has_default_meals(authenticated_client):
    client, _ = authenticated_client

    response = client.get(reverse("default-meal-list"))

    assert response.status_code == 200

    data = response.json()

    expected = [
        {
            "name": "Breakfast",
            "order": 1,
            "description": "",
        },
        {
            "name": "Lunch",
            "order": 2,
            "description": "",
        },
        {
            "name": "Snack",
            "order": 3,
            "description": "",
        },
        {
            "name": "Dinner",
            "order": 4,
            "description": "",
        },
    ]

    assert len(data) == len(expected)

    for actual, expected_meal in zip(data, expected):
        assert actual["name"] == expected_meal["name"]
        assert actual["order"] == expected_meal["order"]
        assert actual["description"] == expected_meal["description"]
