import type {
  FoodNutrient,
  MealPlan,
  PlannedMeal,
  PlannedMealFood,
  PlannedMealRecipe,
  RecipeNutrient,
} from "@/api/generated";

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
  const servings = food.number_of_servings ?? 1;

  return (food.food.nutrients ?? []).map((nutrient: FoodNutrient) => ({
    name: nutrient.nutrient.name,
    amount: nutrient.amount * servings,
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
 * Combines the nutrients from every planned meal whose `day`
 * matches the supplied day offset.
 */
export function getDayNutrients(
  mealPlan: MealPlan,
  day: number,
): NutrientTotal[] {
  const totals = new Map<string, NutrientTotal>();

  for (const plannedMeal of mealPlan.planned_meals ?? []) {
    if (plannedMeal.day !== day) {
      continue;
    }

    for (const nutrient of getPlannedMealNutrients(plannedMeal)) {
      addNutrient(totals, nutrient.name, nutrient.amount);
    }
  }

  return Array.from(totals.values());
}
