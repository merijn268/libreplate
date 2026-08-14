import { useNavigate } from "react-router-dom";

import type { Food } from "@/api/generated";

import ItemCardActions, {
  type ItemCardMenuItem,
} from "@/components/ItemCardActions";

interface Props {
  food: Food;
  onDelete?: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
}

export default function FoodCardActions({
  food,
  onDelete,
  onToggleFavorite,
}: Props) {
  const navigate = useNavigate();

  const items: ItemCardMenuItem[] = [
    {
      key: "edit",
      label: "Edit",
      onClick: () => navigate(`/foods/${food.id}/edit`),
    },
    {
      key: "favorite",
      label: food.is_favorite ? "Favorited" : "Add favorite",
      onClick: () => onToggleFavorite?.(food.id),
    },
    {
      key: "delete",
      label: "Delete",
      danger: true,
      confirmMessage: `Are you sure you want to delete "${food.name}"?`,
      onClick: () => onDelete?.(food.id),
    },
  ];

  return <ItemCardActions items={items} ariaLabel="Open food actions" />;
}
