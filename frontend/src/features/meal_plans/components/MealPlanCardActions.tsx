import { useNavigate } from "react-router-dom";

import type { MealPlanMinimal } from "@/api/generated/types.gen";

import ItemCardActions, {
  type ItemCardMenuItem,
} from "@/components/ItemCardActions";

interface Props {
  mealPlan: MealPlanMinimal;
  onDelete?: (id: number) => void;
  onActivate?: (id: number) => void;
  onDeactivate?: (id: number) => void;
  onToggleFavorite?: (id: number, isFavorite: boolean) => void;
}

export default function MealPlanCardActions({
  mealPlan,
  onDelete,
  onActivate,
  onDeactivate,
  onToggleFavorite,
}: Props) {
  const navigate = useNavigate();

  const items: ItemCardMenuItem[] = [
    ...(mealPlan.is_active
      ? [
          {
            key: "deactivate",
            label: "Deactivate",
            onClick: () => onDeactivate?.(mealPlan.id),
          },
        ]
      : [
          {
            key: "activate",
            label: "Activate",
            onClick: () => onActivate?.(mealPlan.id),
          },
        ]),
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
