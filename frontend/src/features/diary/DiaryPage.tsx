import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  mealsDayList,
  mealsCreate,
  mealsMealFoodsCreate,
} from "@/api/generated";

import type { DayMeal, Food, Recipe } from "@/api/generated";

import NutrientTotalsBar from "../../components/bars/NutrientsTotalBar";
import FoodPickerModal from "../foods/components/FoodPickerModal";
import RecipePickerModal from "../recipes/components/common/RecipePickermodal";
import AddToMealModal from "../../components/modals/AddToMealModal";

import DiaryHeader from "../../components/DateSelector";
import MealList from "./components/MealList";

import { computeDailyTotals } from "@/features/diary/utils/computeDailyTotals";

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function DiaryPage() {
  const queryClient = useQueryClient();

  const todayString = formatDate(new Date());

  const [selectedDate, setSelectedDate] = useState(todayString);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFoodPickerOpen, setIsFoodPickerOpen] = useState(false);
  const [isRecipePickerOpen, setIsRecipePickerOpen] = useState(false);

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

  // DiaryPage is responsible for knowing how totals are calculated.
  const totals = computeDailyTotals(meals);

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

      {/* TODO this should be in a component not in diary page. */}
      <AddToMealModal
        isOpen={isAddModalOpen}
        title="Add to meals"
        onClose={closeAddModal}
        onFood={openFoodPicker}
        onRecipe={openRecipePicker}
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
      />

      <MealList
        meals={meals}
        onAdd={openAddModal}
        onDiaryChanged={refreshDiary}
      />
    </div>
  );
}
