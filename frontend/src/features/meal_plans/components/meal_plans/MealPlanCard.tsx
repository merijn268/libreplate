import { useNavigate } from "react-router-dom";

import type { MealPlanMinimal } from "@/api/generated/types.gen";

import ItemCard from "@/components/ItemCard";
import MealPlanCardActions from "../MealPlanCardActions";

interface Props {
  mealPlan: MealPlanMinimal;
  onDelete?: (id: number) => void;
  onToggleFavorite?: (id: number, isFavorite: boolean) => void;
}

export default function MealPlanCard({
  mealPlan,
  onDelete,
  onToggleFavorite,
}: Props) {
  const navigate = useNavigate();

  return (
    <ItemCard
      title={mealPlan.name}
      onClick={() => navigate(`/meal-plans/${mealPlan.id}/edit`)}
      actions={
        <MealPlanCardActions
          mealPlan={mealPlan}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      }
      meta={<>{mealPlan.description}</>}
    />
  );
}
