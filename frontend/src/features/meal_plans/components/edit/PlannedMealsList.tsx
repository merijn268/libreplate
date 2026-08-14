import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { MealPlan, PlannedMeal } from "@/api/generated";
import type { Food, Recipe } from "@/api/generated/types.gen";
import {
  mealPlansFoodsCreate,
  mealPlansFoodsDestroy,
  mealPlansPlannedMealsCreate,
  mealPlansRecipesCreate,
  mealPlansRecipesDestroy,
} from "@/api/generated";
import type {
  PlannedMealFoodWritable,
  PlannedMealRecipeWritable,
  PlannedMealWritable,
} from "@/api/generated";

import MealCard from "@/components/ui/meal_card/MealCard";
import AmountItem from "@/components/ui/meal_card/AmountItem";
import TotalsModal from "@/components/ui/modals/NutrientsTotalsModal";
import AddToMealModal from "@/components/ui/modals/AddToMealModal";
import FoodPickerModal from "@/features/foods/components/FoodPickerModal";
import RecipePickerModal from "@/features/recipes/components/common/RecipePickermodal";
import { getPlannedMealNutrients } from "@/features/meal_plans/components/mealPlanNutrients";

type Props = {
  mealPlan: MealPlan;
  day: number;
};

type MealTotals = {
  energy: number;
  protein: number;
  fat: number;
  carbs: number;
};

type AddModal = "none" | "type" | "food" | "recipe";

export default function PlannedMealsList({ mealPlan, day }: Props) {
  const queryClient = useQueryClient();

  const [openMeals, setOpenMeals] = useState<Set<string>>(() => new Set());

  const [totalsMeal, setTotalsMeal] = useState<PlannedMeal | null>(null);
  const [addMeal, setAddMeal] = useState<PlannedMeal | null>(null);
  const [addModal, setAddModal] = useState<AddModal>("none");

  const invalidateMealPlan = () =>
    queryClient.invalidateQueries({ queryKey: ["meal-plan", mealPlan.id] });

  /*
   * Virtual meals (meal.id == null) don't exist on the server yet — they're
   * placeholders generated client-side for a day/slot that has no planned
   * meal. Before we can attach a food or recipe to one, we have to create
   * the real PlannedMeal first and use the id it comes back with.
   */
  const materializeMeal = async (meal: PlannedMeal): Promise<number> => {
    if (meal.id != null) {
      return meal.id;
    }

    const body: PlannedMealWritable & { meal_plan_id: number } = {
      meal_plan_id: mealPlan.id,
      name: meal.name,
      day: meal.day,
      order: meal.order,
    };

    const response = await mealPlansPlannedMealsCreate({ body });

    if (response.data?.id == null) {
      throw new Error("Failed to create planned meal.");
    }

    return response.data.id;
  };

  const addFoodMutation = useMutation({
    mutationFn: async ({
      meal,
      foods,
    }: {
      meal: PlannedMeal;
      foods: Food[];
    }) => {
      const plannedMealId = await materializeMeal(meal);

      await Promise.all(
        foods.map((food) => {
          const body: PlannedMealFoodWritable = {
            planned_meal_id: plannedMealId,
            food_id: food.id,
            serving_size: food.serving,
            number_of_servings: 1,
          };

          return mealPlansFoodsCreate({ body });
        }),
      );
    },
    onSuccess: invalidateMealPlan,
  });

  const addRecipeMutation = useMutation({
    mutationFn: async ({
      meal,
      recipe,
      servings,
    }: {
      meal: PlannedMeal;
      recipe: Recipe;
      servings: number;
    }) => {
      const plannedMealId = await materializeMeal(meal);

      const body: PlannedMealRecipeWritable = {
        planned_meal_id: plannedMealId,
        recipe_id: recipe.id,
        number_of_servings: servings,
      };

      await mealPlansRecipesCreate({ body });
    },
    onSuccess: invalidateMealPlan,
  });

  const deleteFoodMutation = useMutation({
    mutationFn: (plannedFoodId: number) =>
      mealPlansFoodsDestroy({ path: { id: plannedFoodId } }),
    onSuccess: invalidateMealPlan,
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: (plannedRecipeId: number) =>
      mealPlansRecipesDestroy({ path: { id: plannedRecipeId } }),
    onSuccess: invalidateMealPlan,
  });

  const plannedMeals = useMemo(() => {
    return [...(mealPlan.planned_meals ?? [])]
      .filter((meal) => meal.day === day)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [mealPlan.planned_meals, day]);

  const getMealKey = (meal: PlannedMeal, index: number) => {
    if (meal.id != null) {
      return `meal-${meal.id}`;
    }

    return `virtual-meal-${day}-${index}`;
  };

  const toggleMeal = (key: string) => {
    setOpenMeals((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  };

  const getMealTotals = (meal: PlannedMeal): MealTotals => {
    const nutrients = getPlannedMealNutrients(meal);

    const getAmount = (name: string) => {
      return (
        nutrients.find(
          (nutrient) => nutrient.name.toLowerCase() === name.toLowerCase(),
        )?.amount ?? 0
      );
    };

    return {
      energy: getAmount("energy"),
      protein: getAmount("protein"),
      fat: getAmount("fat"),
      carbs: getAmount("carbs"),
    };
  };

  const totals = totalsMeal ? getMealTotals(totalsMeal) : null;

  const openAddModal = (meal: PlannedMeal) => {
    setAddMeal(meal);
    setAddModal("type");
  };

  const closeAddFlow = () => {
    setAddModal("none");
    setAddMeal(null);
  };

  const openFoodPicker = () => {
    setAddModal("food");
  };

  const openRecipePicker = () => {
    setAddModal("recipe");
  };

  const handleFoodSelect = async (foods: Food[]) => {
    if (addMeal == null) {
      return;
    }

    const meal = addMeal;
    closeAddFlow();

    try {
      await addFoodMutation.mutateAsync({ meal, foods });
    } catch (error) {
      console.error("Failed to add foods to planned meal", error);
    }
  };

  const handleRecipeSelect = async (recipe: Recipe, servings: number) => {
    if (addMeal == null) {
      return;
    }

    const meal = addMeal;
    closeAddFlow();

    try {
      await addRecipeMutation.mutateAsync({ meal, recipe, servings });
    } catch (error) {
      console.error("Failed to add recipe to planned meal", error);
    }
  };

  const handleDeleteFood = (plannedFoodId: number) => {
    if (deleteFoodMutation.isPending) {
      return;
    }

    const confirmed = window.confirm("Remove this food from the meal?");

    if (!confirmed) {
      return;
    }

    deleteFoodMutation.mutate(plannedFoodId);
  };

  const handleDeleteRecipe = (plannedRecipeId: number) => {
    if (deleteRecipeMutation.isPending) {
      return;
    }

    const confirmed = window.confirm("Remove this recipe from the meal?");

    if (!confirmed) {
      return;
    }

    deleteRecipeMutation.mutate(plannedRecipeId);
  };

  return (
    <>
      <div className="mt-3">
        {plannedMeals.map((meal, mealIndex) => {
          const mealKey = getMealKey(meal, mealIndex);
          const mealTotals = getMealTotals(meal);

          return (
            <MealCard
              key={mealKey}
              name={meal.name}
              open={openMeals.has(mealKey)}
              totals={mealTotals}
              onToggle={() => toggleMeal(mealKey)}
              onShowTotals={() => setTotalsMeal(meal)}
              onAdd={() => openAddModal(meal)}
            >
              <ul className="list-group list-group-flush mt-2">
                {(meal.foods ?? []).map((plannedFood, foodIndex) => {
                  const foodKey =
                    plannedFood.id != null
                      ? `food-${plannedFood.id}`
                      : `${mealKey}-food-${foodIndex}`;

                  return (
                    <AmountItem
                      key={foodKey}
                      label={plannedFood.food.name}
                      amount={`${plannedFood.serving_size} ${plannedFood.food.unit.name}`}
                      onClick={() => {
                        // TODO: edit planned food
                      }}
                      onDelete={() => handleDeleteFood(plannedFood.id)}
                    />
                  );
                })}

                {(meal.recipes ?? []).map((plannedRecipe, recipeIndex) => {
                  const recipeKey =
                    plannedRecipe.id != null
                      ? `recipe-${plannedRecipe.id}`
                      : `${mealKey}-recipe-${recipeIndex}`;

                  const servings = plannedRecipe.number_of_servings ?? 1;

                  return (
                    <AmountItem
                      key={recipeKey}
                      label={plannedRecipe.recipe.name}
                      amount={`${servings} serving${servings === 1 ? "" : "s"}`}
                      onClick={() => {
                        // TODO: edit planned recipe
                      }}
                      onDelete={() => handleDeleteRecipe(plannedRecipe.id)}
                    />
                  );
                })}
              </ul>
            </MealCard>
          );
        })}
      </div>

      <AddToMealModal
        isOpen={addModal === "type" && addMeal != null}
        title={addMeal ? `Add to ${addMeal.name}` : "Add to meal"}
        onClose={closeAddFlow}
        onFood={openFoodPicker}
        onRecipe={openRecipePicker}
      />

      <FoodPickerModal
        isOpen={addModal === "food" && addMeal != null}
        onClose={closeAddFlow}
        onSelect={handleFoodSelect}
      />

      <RecipePickerModal
        isOpen={addModal === "recipe" && addMeal != null}
        onClose={closeAddFlow}
        onSelect={handleRecipeSelect}
      />

      {totalsMeal != null && totals != null && (
        <TotalsModal
          isOpen={true}
          onClose={() => setTotalsMeal(null)}
          title={totalsMeal.name}
          totals={totals}
        />
      )}
    </>
  );
}
