import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  Food,
  MealPlan,
  PlannedMeal,
  PlannedMealEntryRecurrence,
  Recipe,
} from "@/api/generated";

import {
  mealPlansFoodsCreate,
  mealPlansFoodsDestroy,
  mealPlansFoodsPartialUpdate,
  mealPlansPlannedMealsCreate,
  mealPlansRecipesCreate,
  mealPlansRecipesDestroy,
  mealPlansRecipesPartialUpdate,
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
import EditFoodAmountModal from "@/components/ui/modals/EditFoodAmountModal";
import EditRecipeAmountModal from "@/components/ui/modals/EditRecipeAmountModal";
import EditRecurrenceModal from "@/components/ui/modals/EditRecurrenceModal";

import FoodPickerModal from "@/features/foods/components/FoodPickerModal";
import RecipePickerModal from "@/features/recipes/components/common/RecipePickermodal";

import { getPlannedMealNutrients } from "@/features/meal_plans/components/mealPlanNutrients";

import { entryOccursOnDay } from "@/components/ui/meal_card/mealEntryRecurrence";

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

type EditModal = "none" | "food" | "recipe" | "recurrence";

type EditEntry =
  | {
      type: "food";
      id: number;
      food: Food;
      servingSize: number;
      numberOfServings: number;
      recurrence?: PlannedMealEntryRecurrence;
    }
  | {
      type: "recipe";
      id: number;
      recipe: Recipe;
      numberOfServings: number;
      recurrence?: PlannedMealEntryRecurrence;
    };

function normalizeRecurrence(
  recurrence: PlannedMealEntryRecurrence | null | undefined,
): PlannedMealEntryRecurrence | undefined {
  return recurrence ?? undefined;
}

export default function PlannedMealsList({ mealPlan, day }: Props) {
  const queryClient = useQueryClient();

  /*
   * Meal cards are open by default.
   * We only keep track of the cards the user explicitly collapsed.
   */
  const [collapsedMeals, setCollapsedMeals] = useState<Set<string>>(
    () => new Set(),
  );

  const [totalsMeal, setTotalsMeal] = useState<PlannedMeal | null>(null);
  const [addMeal, setAddMeal] = useState<PlannedMeal | null>(null);
  const [addModal, setAddModal] = useState<AddModal>("none");
  const [editEntry, setEditEntry] = useState<EditEntry | null>(null);
  const [editModal, setEditModal] = useState<EditModal>("none");

  const invalidateMealPlan = () => {
    return queryClient.invalidateQueries({
      queryKey: ["meal-plan", mealPlan.id],
    });
  };

  /*
   * Virtual meals don't exist on the server yet.
   * Materialize them before adding a food/recipe.
   */
  const materializeMeal = async (meal: PlannedMeal): Promise<number> => {
    if (meal.id != null) {
      return meal.id;
    }

    const body: PlannedMealWritable & {
      meal_plan_id: number;
    } = {
      meal_plan_id: mealPlan.id,
      name: meal.name,
      day: meal.day,
      order: meal.order,
    };

    const response = await mealPlansPlannedMealsCreate({
      body,
    });

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

          return mealPlansFoodsCreate({
            body,
          });
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

      await mealPlansRecipesCreate({
        body,
      });
    },

    onSuccess: invalidateMealPlan,
  });

  const deleteFoodMutation = useMutation({
    mutationFn: (plannedFoodId: number) =>
      mealPlansFoodsDestroy({
        path: {
          id: plannedFoodId,
        },
      }),

    onSuccess: invalidateMealPlan,
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: (plannedRecipeId: number) =>
      mealPlansRecipesDestroy({
        path: {
          id: plannedRecipeId,
        },
      }),

    onSuccess: invalidateMealPlan,
  });

  const editFoodMutation = useMutation({
    mutationFn: async ({
      id,
      servingSize,
      numberOfServings,
      recurrence,
    }: {
      id: number;
      servingSize: number;
      numberOfServings: number;
      recurrence?: PlannedMealEntryRecurrence;
    }) => {
      await mealPlansFoodsPartialUpdate({
        path: {
          id,
        },
        body: {
          serving_size: servingSize,
          number_of_servings: numberOfServings,
          recurrence,
        },
      });
    },

    onSuccess: invalidateMealPlan,
  });

  const editRecipeMutation = useMutation({
    mutationFn: async ({
      id,
      numberOfServings,
      recurrence,
    }: {
      id: number;
      numberOfServings: number;
      recurrence?: PlannedMealEntryRecurrence;
    }) => {
      await mealPlansRecipesPartialUpdate({
        path: {
          id,
        },
        body: {
          number_of_servings: numberOfServings,
          recurrence,
        },
      });
    },

    onSuccess: invalidateMealPlan,
  });

  const plannedMeals = useMemo(() => {
    const sourceMeals = [...(mealPlan.planned_meals ?? [])];

    const mealsByKey = new Map<string, PlannedMeal>();

    /*
     * First, add meals that actually belong to this day.
     */
    for (const meal of sourceMeals) {
      if (meal.day !== day) {
        continue;
      }

      const key = `${meal.name}-${meal.order ?? 0}`;

      mealsByKey.set(key, {
        ...meal,
        foods: [...(meal.foods ?? [])],
        recipes: [...(meal.recipes ?? [])],
      });
    }

    /*
     * Then project recurring entries from other days.
     */
    for (const sourceMeal of sourceMeals) {
      if (sourceMeal.day === day) {
        continue;
      }

      const recurringFoods = (sourceMeal.foods ?? []).filter((plannedFood) =>
        entryOccursOnDay({
          sourceDay: sourceMeal.day,
          targetDay: day,
          recurrence: normalizeRecurrence(plannedFood.recurrence),
          mealPlanStartDay: mealPlan.start_day,
        }),
      );

      const recurringRecipes = (sourceMeal.recipes ?? []).filter(
        (plannedRecipe) =>
          entryOccursOnDay({
            sourceDay: sourceMeal.day,
            targetDay: day,
            recurrence: normalizeRecurrence(plannedRecipe.recurrence),
            mealPlanStartDay: mealPlan.start_day,
          }),
      );

      if (recurringFoods.length === 0 && recurringRecipes.length === 0) {
        continue;
      }

      const key = `${sourceMeal.name}-${sourceMeal.order ?? 0}`;

      const existing = mealsByKey.get(key);

      if (existing != null) {
        existing.foods = [...(existing.foods ?? []), ...recurringFoods];

        existing.recipes = [...(existing.recipes ?? []), ...recurringRecipes];

        continue;
      }

      /*
       * Client-side display copy.
       *
       * The entries retain their original database IDs,
       * allowing edit/delete to operate on the source entry.
       */
      mealsByKey.set(key, {
        ...sourceMeal,
        day,
        foods: recurringFoods,
        recipes: recurringRecipes,
      });
    }

    return [...mealsByKey.values()].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
  }, [mealPlan.planned_meals, mealPlan.start_day, day]);

  const getMealKey = (meal: PlannedMeal, index: number) => {
    if (meal.id != null) {
      return `meal-${meal.id}`;
    }

    return `virtual-meal-${day}-${index}`;
  };

  const toggleMeal = (key: string) => {
    setCollapsedMeals((current) => {
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
      await addFoodMutation.mutateAsync({
        meal,
        foods,
      });
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
      await addRecipeMutation.mutateAsync({
        meal,
        recipe,
        servings,
      });
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

  const openFoodEditor = (
    plannedFood: NonNullable<PlannedMeal["foods"]>[number],
  ) => {
    setEditEntry({
      type: "food",
      id: plannedFood.id,
      food: plannedFood.food,
      servingSize: plannedFood.serving_size,
      numberOfServings: plannedFood.number_of_servings ?? 1,
      recurrence: normalizeRecurrence(plannedFood.recurrence),
    });

    setEditModal("food");
  };

  const openRecipeEditor = (
    plannedRecipe: NonNullable<PlannedMeal["recipes"]>[number],
  ) => {
    setEditEntry({
      type: "recipe",
      id: plannedRecipe.id,
      recipe: plannedRecipe.recipe,
      numberOfServings: plannedRecipe.number_of_servings ?? 1,
      recurrence: normalizeRecurrence(plannedRecipe.recurrence),
    });

    setEditModal("recipe");
  };

  const closeEditFlow = () => {
    setEditModal("none");
    setEditEntry(null);
  };

  const openRecurrenceEditor = () => {
    if (editEntry == null) {
      return;
    }

    setEditModal("recurrence");
  };

  const handleRecurrenceSave = (recurrence?: PlannedMealEntryRecurrence) => {
    if (editEntry == null) {
      return;
    }

    setEditEntry({
      ...editEntry,
      recurrence,
    });

    setEditModal(editEntry.type === "food" ? "food" : "recipe");
  };

  const handleFoodSave = async (values: {
    serving_size: number;
    number_of_servings: number;
    recurrence?: PlannedMealEntryRecurrence;
  }) => {
    if (editEntry == null || editEntry.type !== "food") {
      return;
    }

    try {
      await editFoodMutation.mutateAsync({
        id: editEntry.id,
        servingSize: values.serving_size,
        numberOfServings: values.number_of_servings,
        recurrence: values.recurrence,
      });

      closeEditFlow();
    } catch (error) {
      console.error("Failed to update planned food", error);
    }
  };

  const handleRecipeSave = async (values: {
    number_of_servings: number;
    recurrence?: PlannedMealEntryRecurrence;
  }) => {
    if (editEntry == null || editEntry.type !== "recipe") {
      return;
    }

    try {
      await editRecipeMutation.mutateAsync({
        id: editEntry.id,
        numberOfServings: values.number_of_servings,
        recurrence: values.recurrence,
      });

      closeEditFlow();
    } catch (error) {
      console.error("Failed to update planned recipe", error);
    }
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
              open={!collapsedMeals.has(mealKey)}
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
                      onClick={() => openFoodEditor(plannedFood)}
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
                      onClick={() => openRecipeEditor(plannedRecipe)}
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

      {editEntry?.type === "food" && editModal === "food" && (
        <EditFoodAmountModal
          food={editEntry.food}
          servingSize={editEntry.servingSize}
          numberOfServings={editEntry.numberOfServings}
          recurrence={editEntry.recurrence}
          onClose={closeEditFlow}
          onEditRecurrence={openRecurrenceEditor}
          onSave={handleFoodSave}
        />
      )}

      {editEntry?.type === "recipe" && editModal === "recipe" && (
        <EditRecipeAmountModal
          recipe={editEntry.recipe}
          numberOfServings={editEntry.numberOfServings}
          recurrence={editEntry.recurrence}
          onClose={closeEditFlow}
          onEditRecurrence={openRecurrenceEditor}
          onSave={handleRecipeSave}
        />
      )}

      {editEntry != null && editModal === "recurrence" && (
        <EditRecurrenceModal
          isOpen
          recurrence={editEntry.recurrence}
          onClose={() =>
            setEditModal(editEntry.type === "food" ? "food" : "recipe")
          }
          onSave={handleRecurrenceSave}
        />
      )}

      {totalsMeal != null && totals != null && (
        <TotalsModal
          isOpen
          onClose={() => setTotalsMeal(null)}
          title={totalsMeal.name}
          totals={totals}
        />
      )}
    </>
  );
}
