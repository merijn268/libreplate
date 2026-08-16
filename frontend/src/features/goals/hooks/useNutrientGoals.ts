import { useQuery } from "@tanstack/react-query";

import { goalsGoalPlansList } from "@/api/generated";

export type NutrientGoals = {
  energy?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
};

// Maps the four macros this app tracks in totals bars to the nutrient
// names they're likely stored under. Match is case-insensitive.
const NUTRIENT_NAME_MATCHES: Record<keyof NutrientGoals, string[]> = {
  energy: ["energy", "calories", "kcal"],
  protein: ["protein"],
  fat: ["fat"],
  carbs: ["carbohydrates", "carbohydrate", "carbs"],
};

/**
 * Reads the user's goal plan (there's only ever one from the UI's
 * perspective) and returns whichever of energy/protein/fat/carbs it has
 * a target for. Macros without a configured goal are left undefined.
 */
export function useNutrientGoals() {
  const query = useQuery({
    queryKey: ["goals", "goal-plans"],
    queryFn: async () => {
      const response = await goalsGoalPlansList({});

      return response.data ?? [];
    },
  });

  const plan = query.data?.[0];
  const goals: NutrientGoals = {};

  for (const goal of plan?.nutrient_goals ?? []) {
    const name = goal.nutrient.name.trim().toLowerCase();

    for (const key of Object.keys(NUTRIENT_NAME_MATCHES) as Array<
      keyof NutrientGoals
    >) {
      if (NUTRIENT_NAME_MATCHES[key].includes(name)) {
        goals[key] = goal.amount;
      }
    }
  }

  return {
    goals,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
