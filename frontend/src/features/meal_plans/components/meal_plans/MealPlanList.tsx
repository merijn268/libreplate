import MealPlanCard from "./MealPlanCard";

import type { MealPlanMinimal as MealPlanListType } from "@/api/generated/types.gen";

interface Props {
  mealPlans: MealPlanListType[];
  onDelete?: (id: number) => void;
  onActivate?: (id: number) => void;
  onToggleFavorite?: (id: number, isFavorite: boolean) => void;
}

export default function MealPlanList({
  mealPlans,
  onDelete,
  onActivate,
  onToggleFavorite,
}: Props) {
  return (
    <>
      {mealPlans.map((mealPlan) => (
        <MealPlanCard
          key={mealPlan.id}
          mealPlan={mealPlan}
          onDelete={onDelete}
          onActivate={onActivate}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </>
  );
}
