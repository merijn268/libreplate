import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import {
  mealPlansActiveRetrieve,
  mealPlansApplyCreate,
  mealsDayList,
  mealsCreate,
  mealsMealFoodsCreate,
  recipesCreate,
  recipesIngredientsCreate,
} from "@/api/generated";

import type { DayMeal, Food, Recipe } from "@/api/generated";

import NutrientTotalsBar from "../../components/bars/NutrientsTotalBar";
import FoodPickerModal from "../foods/components/FoodPickerModal";
import RecipePickerModal from "../recipes/components/common/RecipePickermodal";
import MealActionsModal from "./components/MealActionsModal";
import BodyMetricsEditModal from "@/features/body_metrics/BodyMetricsEditModal";

import DiaryHeader from "../../components/DateSelector";
import MealList from "./components/MealList";
import ActionPillButton from "../../components/buttons/ActionPillButton";
import ActionPillButtonGroup from "../../components/buttons/ActionPillButtonGroup";

import { computeDailyTotals } from "@/features/diary/utils/computeDailyTotals";
import { useNutrientGoals } from "@/features/goals/hooks/useNutrientGoals";

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function DiaryPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const todayString = formatDate(new Date());
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFoodPickerOpen, setIsFoodPickerOpen] = useState(false);
  const [isRecipePickerOpen, setIsRecipePickerOpen] = useState(false);
  const [isBodyMetricsOpen, setIsBodyMetricsOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<DayMeal | null>(null);

  const diaryQueryKey = ["meals", "day", selectedDate] as const;

  const {
    data: meals = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: diaryQueryKey,
    queryFn: async () => {
      const response = await mealsDayList({
        path: {
          day: selectedDate,
        },
      });

      return response.data ?? [];
    },
  });

  const {
    data: activeMealPlan,
    isLoading: isActiveMealPlanLoading,
    isError: isActiveMealPlanError,
  } = useQuery({
    queryKey: ["meal-plans", "active"],
    queryFn: async () => {
      const response = await mealPlansActiveRetrieve();

      return response.data;
    },
    retry: false,
  });

  const totals = computeDailyTotals(meals);
  const { goals } = useNutrientGoals();

  const createMeal = useMutation({
    mutationFn: async (options: Parameters<typeof mealsCreate>[0]) => {
      const response = await mealsCreate(options);

      return response.data;
    },
  });

  const createMealFood = useMutation({
    mutationFn: async (options: Parameters<typeof mealsMealFoodsCreate>[0]) => {
      const response = await mealsMealFoodsCreate(options);

      return response.data;
    },
  });

  const createRecipe = useMutation({
    mutationFn: async (options: Parameters<typeof recipesCreate>[0]) => {
      const response = await recipesCreate(options);

      return response.data;
    },
  });

  const createRecipeIngredient = useMutation({
    mutationFn: async (
      options: Parameters<typeof recipesIngredientsCreate>[0],
    ) => {
      const response = await recipesIngredientsCreate(options);

      return response.data;
    },
  });

  const applyMealPlan = useMutation({
    mutationFn: async () => {
      if (!activeMealPlan) {
        throw new Error("No active meal plan.");
      }

      const body = {
        start_date: selectedDate,
        days: 1,
      };

      const response = await mealPlansApplyCreate({
        path: {
          id: activeMealPlan.id,
        },
        body: body as unknown as Parameters<
          typeof mealPlansApplyCreate
        >[0]["body"],
      });

      return response.data;
    },
    onSuccess: async () => {
      await refreshDiary();
    },
  });

  async function refreshDiary() {
    await queryClient.invalidateQueries({
      queryKey: diaryQueryKey,
    });
  }

  function changeDay(amount: number) {
    const date = new Date(`${selectedDate}T00:00:00`);

    date.setDate(date.getDate() + amount);

    setSelectedDate(formatDate(date));
  }

  function openAddModal(meal: DayMeal) {
    setSelectedMeal(meal);
    setIsAddModalOpen(true);
  }

  function openFoodPicker() {
    setIsAddModalOpen(false);
    setIsFoodPickerOpen(true);
  }

  function openRecipePicker() {
    setIsAddModalOpen(false);
    setIsRecipePickerOpen(true);
  }

  async function ensureMealId(meal: DayMeal): Promise<number> {
    if (meal.meal_id !== null) {
      return meal.meal_id;
    }

    const newMeal = await createMeal.mutateAsync({
      body: {
        default_meal: meal.default_meal.id,
        name: meal.name,
        date: meal.date,
        note: meal.note,
        order: meal.order,
        meal_foods: [],
      },
    });

    if (!newMeal) {
      throw new Error("Failed to create meal");
    }

    return newMeal.id;
  }

  async function handleFoodSelect(foods: Food[]) {
    if (!selectedMeal || foods.length === 0) {
      return;
    }

    const mealId = await ensureMealId(selectedMeal);

    await Promise.all(
      foods.map((food) =>
        createMealFood.mutateAsync({
          body: {
            meal_id: mealId,
            food_id: food.id,
            serving_size: food.serving ?? 1,
            number_of_servings: 1,
          },
        }),
      ),
    );

    await refreshDiary();

    setIsFoodPickerOpen(false);
    setSelectedMeal(null);
  }

  async function handleRecipeSelect(recipe: Recipe, servings: number) {
    if (!selectedMeal) {
      return;
    }

    const mealId = await ensureMealId(selectedMeal);

    await Promise.all(
      recipe.ingredients.map((ingredient) =>
        createMealFood.mutateAsync({
          body: {
            meal_id: mealId,
            food_id: ingredient.food,
            serving_size: ingredient.serving_amount ?? 1,
            number_of_servings: (ingredient.number_of_servings ?? 1) * servings,
          },
        }),
      ),
    );

    await refreshDiary();

    setIsRecipePickerOpen(false);
    setSelectedMeal(null);
  }

  async function handleSaveAsRecipe() {
    if (!selectedMeal) {
      return;
    }

    const mealFoods = selectedMeal.meal_foods ?? [];

    if (mealFoods.length === 0) {
      return;
    }

    const recipe = await createRecipe.mutateAsync({
      body: {
        name: `${selectedMeal.name} Recipe`,
      },
    });

    if (!recipe) {
      throw new Error("Failed to create recipe");
    }

    for (const [index, mealFood] of mealFoods.entries()) {
      await createRecipeIngredient.mutateAsync({
        path: {
          id: recipe.id,
        },
        body: {
          food: mealFood.food.id,
          serving_amount: mealFood.serving_size,
          number_of_servings: mealFood.number_of_servings,
          order: index,
        },
      });
    }

    setIsAddModalOpen(false);
    setSelectedMeal(null);

    navigate(`/recipes/${recipe.id}/edit`);
  }

  async function handleApplyMealPlan() {
    if (!activeMealPlan || applyMealPlan.isPending) {
      return;
    }

    await applyMealPlan.mutateAsync();
  }

  function closeAddModal() {
    setIsAddModalOpen(false);
    setSelectedMeal(null);
  }

  function closeFoodPicker() {
    setIsFoodPickerOpen(false);
    setSelectedMeal(null);
  }

  function closeRecipePicker() {
    setIsRecipePickerOpen(false);
    setSelectedMeal(null);
  }

  return (
    <div className="container">
      <FoodPickerModal
        isOpen={isFoodPickerOpen}
        onClose={closeFoodPicker}
        onSelect={handleFoodSelect}
      />

      <RecipePickerModal
        isOpen={isRecipePickerOpen}
        onClose={closeRecipePicker}
        onSelect={handleRecipeSelect}
      />

      <BodyMetricsEditModal
        isOpen={isBodyMetricsOpen}
        date={selectedDate}
        onClose={() => setIsBodyMetricsOpen(false)}
      />

      {/* TODO this should be in a component not in diary page. */}
      <MealActionsModal
        isOpen={isAddModalOpen}
        title="Meal actions"
        onClose={closeAddModal}
        onFood={openFoodPicker}
        onRecipe={openRecipePicker}
        onSaveAsRecipe={handleSaveAsRecipe}
      />

      <DiaryHeader
        selectedDate={selectedDate}
        todayString={todayString}
        onChangeDate={setSelectedDate}
        onPrevious={() => changeDay(-1)}
        onNext={() => changeDay(1)}
      />

      {isError && (
        <div className="alert alert-danger">Failed to load diary.</div>
      )}

      {!isLoading && meals.length === 0 && (
        <div className="alert alert-secondary">No meal slots configured.</div>
      )}

      <NutrientTotalsBar
        energy={totals.energy}
        protein={totals.protein}
        fat={totals.fat}
        carbs={totals.carbs}
        energyGoal={goals.energy}
        proteinGoal={goals.protein}
        fatGoal={goals.fat}
        carbsGoal={goals.carbs}
      />

      <ActionPillButtonGroup>
        <ActionPillButton
          label="Body Metrics"
          onClick={() => setIsBodyMetricsOpen(true)}
        />

        <ActionPillButton
          label={
            applyMealPlan.isPending
              ? "Applying meal plan..."
              : "Apply Meal Plan"
          }
          onClick={handleApplyMealPlan}
        />

        {/* <ActionPillButton
          label="Add excersice"
          onClick={() => {
            // TODO: add exercise
            console.log("Add exercise clicked");
          }}
        /> */}
      </ActionPillButtonGroup>

      <MealList
        meals={meals}
        onAdd={openAddModal}
        onDiaryChanged={refreshDiary}
      />

      {applyMealPlan.isError && (
        <div className="alert alert-danger mt-3">
          Failed to apply the meal plan.
        </div>
      )}

      {!isActiveMealPlanLoading &&
        !isActiveMealPlanError &&
        !activeMealPlan && (
          <div className="alert alert-secondary mt-3">No active meal plan.</div>
        )}
    </div>
  );
}
