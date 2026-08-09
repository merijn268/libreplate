import pytest
from django.urls import reverse
from foods.models import Food
from meal_plans.models import MealPlan, MealPlanTag
from meals.models import DefaultMeal
from recipes.models import Recipe, RecipeIngredient
from units.models import Unit
# TODO ISort removes inproper imports, instead of raising an error.
# It should be configured to raise an error

@pytest.mark.django_db
class TestMealPlanAPI:
    def test_create_and_retrieve_meal_plan_with_foods_and_recipes(
        self,
        authenticated_client,
        setup_default_data,
    ):
        client, user = authenticated_client

        unit = Unit.objects.get(name="Gram")

        apple = Food.objects.create(
            name="Apple",
            user=user,
            serving=100,
            unit=unit,
        )
        oats = Food.objects.create(
            name="Oats",
            user=user,
            serving=50,
            unit=unit,
        )

        oatmeal = Recipe.objects.create(
            user=user,
            name="Oatmeal Bowl",
            portions=2,
        )
        RecipeIngredient.objects.create(
            recipe=oatmeal,
            food=oats,
            number_of_servings=1,
            serving_amount=50,
            order=0,
        )

        breakfast = DefaultMeal.objects.get(
            user=user,
            name="Breakfast",
        )

        tag = MealPlanTag.objects.create(
            user=user,
            name="Healthy",
        )

        payload = {
            "name": "My Meal Plan",
            "description": "A simple test meal plan",
            "tags": [tag.id],
            "is_favorite": True,
            "start_day": 0,
            "foods": [
                {
                    "meal": breakfast.id,
                    "food_id": apple.id,
                    "day": 0,
                    "serving_size": 100,
                    "number_of_servings": 1,
                }
            ],
            "recipes": [
                {
                    "meal": breakfast.id,
                    "recipe_id": oatmeal.id,
                    "day": 1,
                    "serving_size": 100,
                    "number_of_servings": 1,
                }
            ],
        }

        create_response = client.post(
            reverse("meal-plan-list"),
            payload,
            format="json",
        )

        assert create_response.status_code == 201, create_response.data

        meal_plan_id = create_response.data["id"]

        response = client.get(reverse("meal-plan-detail", args=[meal_plan_id]))

        assert response.status_code == 200

        data = response.data

        assert data["name"] == "My Meal Plan"
        assert data["start_day"] == 0
        assert data["is_favorite"] is True
        assert data["tags"] == [tag.id]

        assert len(data["foods"]) == 1
        assert data["foods"][0]["food"]["id"] == apple.id

        assert len(data["recipes"]) == 1
        assert data["recipes"][0]["recipe"]["id"] == oatmeal.id

    def test_user_cannot_see_another_users_meal_plan(
        self,
        authenticated_client,
        create_user,
    ):
        client, _user = authenticated_client
        other_user = create_user(username="other_user")

        other_plan = MealPlan.objects.create(
            name="Not yours",
            user=other_user,
        )

        response = client.get(reverse("meal-plan-detail", args=[other_plan.id]))

        assert response.status_code == 404

    def test_mark_meal_plan_as_favorite(
        self,
        authenticated_client,
        setup_default_data,
    ):
        client, user = authenticated_client

        meal_plan = MealPlan.objects.create(
            name="My Meal Plan",
            user=user,
            is_favorite=False,
        )

        response = client.post(
            reverse("meal-plan-mark-favorite", args=[meal_plan.id]),
        )

        assert response.status_code == 200
        assert response.data["is_favorite"] is True

        meal_plan.refresh_from_db()

        assert meal_plan.is_favorite is True

    def test_unmark_meal_plan_as_favorite(
        self,
        authenticated_client,
        setup_default_data,
    ):
        client, user = authenticated_client

        meal_plan = MealPlan.objects.create(
            name="My Meal Plan",
            user=user,
            is_favorite=True,
        )

        response = client.post(
            reverse("meal-plan-unmark-favorite", args=[meal_plan.id]),
        )

        assert response.status_code == 200
        assert response.data["is_favorite"] is False

        meal_plan.refresh_from_db()

        assert meal_plan.is_favorite is False

    def test_user_cannot_use_another_users_tag(
        self,
        authenticated_client,
        create_user,
        setup_default_data,
    ):
        client, user = authenticated_client
        other_user = create_user(username="other_user")

        tag = MealPlanTag.objects.create(
            user=other_user,
            name="Other User Tag",
        )

        payload = {
            "name": "My Meal Plan",
            "tags": [tag.id],
        }

        response = client.post(
            reverse("meal-plan-list"),
            payload,
            format="json",
        )

        assert response.status_code == 400
        assert "tags" in response.data

    def test_meal_plan_tags_can_be_updated(
        self,
        authenticated_client,
        setup_default_data,
    ):
        client, user = authenticated_client

        first_tag = MealPlanTag.objects.create(
            user=user,
            name="Healthy",
        )
        second_tag = MealPlanTag.objects.create(
            user=user,
            name="Quick",
        )

        meal_plan = MealPlan.objects.create(
            name="My Meal Plan",
            user=user,
        )
        meal_plan.tags.add(first_tag)

        response = client.patch(
            reverse("meal-plan-detail", args=[meal_plan.id]),
            {
                "tags": [second_tag.id],
            },
            format="json",
        )

        assert response.status_code == 200
        assert response.data["tags"] == [second_tag.id]

        meal_plan.refresh_from_db()

        assert list(meal_plan.tags.values_list("id", flat=True)) == [second_tag.id]
