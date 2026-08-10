import { useNavigate } from "react-router-dom";

import type { MealPlanList } from "@/api/generated/types.gen";

import ItemCardActions, {
  type ItemCardMenuItem,
} from "@/components/ui/ItemCardActions";

interface Props {
  mealPlan: MealPlanList;
  onDelete?: (id: number) => void;
  onToggleFavorite?: (id: number, isFavorite: boolean) => void;
}

export default function MealPlanCardActions({
  mealPlan,
  onDelete,
  onToggleFavorite,
}: Props) {
  const navigate = useNavigate();

  const items: ItemCardMenuItem[] = [
    {
      key: "favorite",
      label: mealPlan.is_favorite ? "Unfavorite" : "Favorite",
      onClick: () =>
        onToggleFavorite?.(mealPlan.id, Boolean(mealPlan.is_favorite)),
    },
    {
      key: "edit",
      label: "Edit",
      onClick: () => navigate(`/meal-plans/${mealPlan.id}/edit`),
    },
    {
      key: "delete",
      label: "Delete",
      danger: true,
      confirmMessage: `Are you sure you want to delete "${mealPlan.name}"? This cannot be undone.`,
      onClick: () => onDelete?.(mealPlan.id),
    },
  ];

  return <ItemCardActions items={items} />;
}
