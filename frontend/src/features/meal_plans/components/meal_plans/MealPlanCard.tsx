import { useNavigate } from "react-router-dom";

import type { MealPlanMinimal } from "@/api/generated/types.gen";

import ItemCard from "@/components/ItemCard";
import MealPlanCardActions from "./MealPlanCardActions";

interface Props {
  mealPlan: MealPlanMinimal;
  onDelete?: (id: number) => void;
  onActivate?: (id: number) => void;
  onDeactivate?: (id: number) => void;
  onToggleFavorite?: (id: number, isFavorite: boolean) => void;
}

export default function MealPlanCard({
  mealPlan,
  onDelete,
  onActivate,
  onDeactivate,
  onToggleFavorite,
}: Props) {
  const navigate = useNavigate();

  return (
    <ItemCard
      title={
        <>
          {mealPlan.name}
          {mealPlan.is_active && (
            <i
              className="bi bi-check-circle-fill ms-2 text-primary"
              aria-label="Active meal plan"
              title="Active meal plan"
            />
          )}
        </>
      }
      onClick={() => navigate(`/meal-plans/${mealPlan.id}/edit`)}
      actions={
        <MealPlanCardActions
          mealPlan={mealPlan}
          onDelete={onDelete}
          onActivate={onActivate}
          onDeactivate={onDeactivate}
          onToggleFavorite={onToggleFavorite}
        />
      }
      meta={<>{mealPlan.description}</>}
    />
  );
}
