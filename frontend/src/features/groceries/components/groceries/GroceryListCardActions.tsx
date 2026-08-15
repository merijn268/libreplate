import { useNavigate } from "react-router-dom";

import type { GroceryList } from "@/api/generated/types.gen";

import ItemCardActions, {
  type ItemCardMenuItem,
} from "@/components/ItemCardActions";

interface Props {
  groceryList: GroceryList;
  onDelete?: (id: number) => void;
  onToggleFavorite?: (id: number, isFavorite: boolean) => void;
}

export default function GroceryListCardActions({
  groceryList,
  onDelete,
  onToggleFavorite,
}: Props) {
  const navigate = useNavigate();

  const items: ItemCardMenuItem[] = [
    {
      key: "favorite",
      label: groceryList.is_favorite ? "Unfavorite" : "Favorite",
      onClick: () =>
        onToggleFavorite?.(groceryList.id, Boolean(groceryList.is_favorite)),
    },
    {
      key: "edit",
      label: "Edit",
      onClick: () => navigate(`/groceries/${groceryList.id}/edit`),
    },
    {
      key: "delete",
      label: "Delete",
      danger: true,
      confirmMessage: `Are you sure you want to delete "${groceryList.name}"? This cannot be undone.`,
      onClick: () => onDelete?.(groceryList.id),
    },
  ];

  return <ItemCardActions items={items} />;
}
