import { useEffect, useMemo, useState } from "react";
import type { MealPlan, PlannedMeal } from "@/api/generated";

import MealCard from "@/components/ui/meal_card/MealCard";
import AmountItem from "@/components/ui/meal_card/AmountItem";
import TotalsModal from "@/components/ui/modals/NutrientsTotalsModal";
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

export default function PlannedMealsList({ mealPlan, day }: Props) {
  const [openMeals, setOpenMeals] = useState<Set<number>>(new Set());
  const [totalsMeal, setTotalsMeal] = useState<PlannedMeal | null>(null);

  const plannedMeals = useMemo(
    () =>
      (mealPlan.planned_meals ?? [])
        .filter((meal) => meal.day === day)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [mealPlan.planned_meals, day],
  );

  useEffect(() => {
    setOpenMeals(new Set(plannedMeals.map((meal) => meal.id)));
  }, [plannedMeals]);

  const toggleMeal = (mealId: number) => {
    setOpenMeals((current) => {
      const next = new Set(current);

      if (next.has(mealId)) {
        next.delete(mealId);
      } else {
        next.add(mealId);
      }

      return next;
    });
  };

  const getMealTotals = (meal: PlannedMeal): MealTotals => {
    const nutrients = getPlannedMealNutrients(meal);

    const getAmount = (name: string) =>
      nutrients.find(
        (nutrient) => nutrient.name.toLowerCase() === name.toLowerCase(),
      )?.amount ?? 0;

    return {
      energy: getAmount("energy"),
      protein: getAmount("protein"),
      fat: getAmount("fat"),
      carbs: getAmount("carbs"),
    };
  };

  const totals = totalsMeal ? getMealTotals(totalsMeal) : null;

  return (
    <>
      <div className="mt-3">
        {plannedMeals.map((meal) => {
          const mealTotals = getMealTotals(meal);

          return (
            <MealCard
              key={meal.id}
              name={meal.name}
              open={openMeals.has(meal.id)}
              totals={mealTotals}
              onToggle={() => toggleMeal(meal.id)}
              onShowTotals={() => {
                setTotalsMeal(meal);
              }}
              onAdd={() => {
                // TODO: add food/recipe to this meal
              }}
            >
              <ul className="list-group list-group-flush mt-2">
                {(meal.foods ?? []).map((plannedFood) => (
                  <AmountItem
                    key={`food-${plannedFood.id}`}
                    label={plannedFood.food.name}
                    amount={`${plannedFood.serving_size} ${plannedFood.food.unit.name}`}
                    onClick={() => {
                      // TODO: edit planned food
                    }}
                    onDelete={() => {
                      // TODO: remove planned food
                    }}
                  />
                ))}

                {(meal.recipes ?? []).map((plannedRecipe) => (
                  <AmountItem
                    key={`recipe-${plannedRecipe.id}`}
                    label={plannedRecipe.recipe.name}
                    amount={`${plannedRecipe.number_of_servings ?? 1} serving${
                      (plannedRecipe.number_of_servings ?? 1) === 1 ? "" : "s"
                    }`}
                    onClick={() => {
                      // TODO: edit planned recipe
                    }}
                    onDelete={() => {
                      // TODO: remove planned recipe
                    }}
                  />
                ))}
              </ul>
            </MealCard>
          );
        })}
      </div>

      {totalsMeal && totals && (
        <TotalsModal
          isOpen={totalsMeal !== null}
          onClose={() => setTotalsMeal(null)}
          title={totalsMeal.name}
          totals={totals}
        />
      )}
    </>
  );
}
