import { useMemo, useState } from "react";
import type { MealPlan, PlannedMeal } from "@/api/generated";
import type { Food, Recipe } from "@/api/generated/types.gen";

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
  const [openMeals, setOpenMeals] = useState<Set<string>>(() => new Set());

  const [totalsMeal, setTotalsMeal] = useState<PlannedMeal | null>(null);
  const [addMeal, setAddMeal] = useState<PlannedMeal | null>(null);
  const [addModal, setAddModal] = useState<AddModal>("none");

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

  const handleFoodSelect = (foods: Food[]) => {
    if (addMeal == null) {
      return;
    }

    /*
     * TODO: API integration.
     *
     * addMeal.id may be null because this can be a virtual meal.
     *
     * Example:
     *
     * if (addMeal.id != null) {
     *   // Persist food against existing planned meal.
     * } else {
     *   // Handle food for virtual meal.
     * }
     */

    console.log("TODO: add foods to planned meal", {
      plannedMeal: addMeal,
      plannedMealId: addMeal.id,
      foods,
    });

    closeAddFlow();
  };

  const handleRecipeSelect = (recipe: Recipe, servings: number) => {
    if (addMeal == null) {
      return;
    }

    /*
     * TODO: API integration.
     *
     * addMeal.id may be null because this can be a virtual meal.
     */

    console.log("TODO: add recipe to planned meal", {
      plannedMeal: addMeal,
      plannedMealId: addMeal.id,
      recipe,
      servings,
    });

    closeAddFlow();
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
                      onDelete={() => {
                        // TODO: remove planned food
                      }}
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
                      onDelete={() => {
                        // TODO: remove planned recipe
                      }}
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
