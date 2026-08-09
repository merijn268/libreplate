import pytest
from apps.foods.models import Food
from apps.nutrients.models import Nutrient
from apps.units.models import Unit
from rest_framework import status


@pytest.fixture
def food_payload(setup_default_data):
    gram = Unit.objects.get(name="Gram")
    protein = Nutrient.objects.first()

    assert protein is not None, "No nutrients were created by setup_default_data"

    return {
        "name": "Chicken Breast",
        "serving": 100,
        "unit_id": gram.id,
        "brand": "Test Brand",
        "description": "Initial description",
        "is_favorite": False,
        "nutrients": [
            {
                "nutrient_id": protein.id,
                "amount": 31.0,
            }
        ],
    }


@pytest.mark.django_db
def test_create_food(authenticated_client, food_payload):
    client, user = authenticated_client

    response = client.post(
        "/api/foods/",
        food_payload,
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED

    food = Food.objects.get(id=response.data["id"])

    assert food.name == "Chicken Breast"
    assert food.user == user
    assert food.food_nutrients.count() == 1


@pytest.mark.django_db
def test_update_food(authenticated_client, food_payload):
    client, _ = authenticated_client

    create_response = client.post(
        "/api/foods/",
        food_payload,
        format="json",
    )

    assert create_response.status_code == status.HTTP_201_CREATED

    food_id = create_response.data["id"]

    response = client.patch(
        f"/api/foods/{food_id}/",
        {
            "name": "Updated Chicken Breast",
            "description": "Updated description",
            "is_favorite": True,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK

    food = Food.objects.get(id=food_id)

    assert food.name == "Updated Chicken Breast"
    assert food.description == "Updated description"
    assert food.is_favorite is True


@pytest.mark.django_db
def test_delete_food(authenticated_client, food_payload):
    client, _ = authenticated_client

    create_response = client.post(
        "/api/foods/",
        food_payload,
        format="json",
    )

    assert create_response.status_code == status.HTTP_201_CREATED

    food_id = create_response.data["id"]

    response = client.delete(
        f"/api/foods/{food_id}/",
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT

    assert not Food.objects.filter(id=food_id).exists()
