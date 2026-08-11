import { useNavigate } from "react-router-dom";

import type { MealPlanList } from "@/api/generated/types.gen";

import ItemCard from "@/components/ui/ItemCard";
import MealPlanCardActions from "../MealPlanCardActions";

interface Props {
  mealPlan: MealPlanList;
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
