import type {
  FoodNutrient,
  MealPlan,
  PlannedMeal,
  PlannedMealFood,
  PlannedMealRecipe,
  RecipeNutrient,
} from "@/api/generated";

import { entryOccursOnDay } from "@/components/meal_card/mealEntryRecurrence";

type NutrientTotal = {
  name: string;
  amount: number;
};

function addNutrient(
  totals: Map<string, NutrientTotal>,
  name: string,
  amount: number,
) {
  const existing = totals.get(name);

  if (existing) {
    existing.amount += amount;
  } else {
    totals.set(name, {
      name,
      amount,
    });
  }
}

function getFoodNutrients(food: PlannedMealFood): NutrientTotal[] {
  const numberOfServings = food.number_of_servings ?? 1;

  return (food.food.nutrients ?? []).map((nutrient: FoodNutrient) => ({
    name: nutrient.nutrient.name,
    amount: (nutrient.amount / 100) * food.serving_size * numberOfServings,
  }));
}
function getRecipeNutrients(recipe: PlannedMealRecipe): NutrientTotal[] {
  const servings = recipe.number_of_servings ?? 1;

  return (recipe.recipe.nutrients ?? []).map((nutrient: RecipeNutrient) => ({
    name: nutrient.name,
    amount: nutrient.amount * servings,
  }));
}

/**
 * Gets the total nutrients for a single planned meal.
 *
 * Combines nutrients from both foods and recipes in the meal.
 */
export function getPlannedMealNutrients(
  plannedMeal: PlannedMeal,
): NutrientTotal[] {
  const totals = new Map<string, NutrientTotal>();

  for (const food of plannedMeal.foods ?? []) {
    for (const nutrient of getFoodNutrients(food)) {
      addNutrient(totals, nutrient.name, nutrient.amount);
    }
  }

  for (const recipe of plannedMeal.recipes ?? []) {
    for (const nutrient of getRecipeNutrients(recipe)) {
      addNutrient(totals, nutrient.name, nutrient.amount);
    }
  }

  return Array.from(totals.values());
}

/**
 * Gets the total nutrients for a day in a meal plan.
 *
 * Foods and recipes can recur onto a different day than
 * their source planned meal. Recurring entries therefore
 * contribute to the selected day's totals whenever their
 * recurrence says they occur on that day.
 */
export function getDayNutrients(
  mealPlan: MealPlan,
  day: number,
): NutrientTotal[] {
  const totals = new Map<string, NutrientTotal>();

  for (const plannedMeal of mealPlan.planned_meals ?? []) {
    /*
     * Foods
     */
    for (const food of plannedMeal.foods ?? []) {
      const occurs = entryOccursOnDay({
        sourceDay: plannedMeal.day,
        targetDay: day,
        recurrence: food.recurrence,
        mealPlanStartDay: mealPlan.start_day,
      });

      if (!occurs) {
        continue;
      }

      for (const nutrient of getFoodNutrients(food)) {
        addNutrient(totals, nutrient.name, nutrient.amount);
      }
    }

    /*
     * Recipes
     */
    for (const recipe of plannedMeal.recipes ?? []) {
      const occurs = entryOccursOnDay({
        sourceDay: plannedMeal.day,
        targetDay: day,
        recurrence: recipe.recurrence,
        mealPlanStartDay: mealPlan.start_day,
      });

      if (!occurs) {
        continue;
      }

      for (const nutrient of getRecipeNutrients(recipe)) {
        addNutrient(totals, nutrient.name, nutrient.amount);
      }
    }
  }

  return Array.from(totals.values());
}
