import { useNavigate } from "react-router-dom";

import type { Recipe } from "@/api/generated/types.gen";

import ItemCardActions, {
  type ItemCardMenuItem,
} from "@/components/ui/ItemCardActions";

interface Props {
  recipe: Recipe;
  onCopy: () => void;
  onDelete?: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
}

export default function RecipeCardActions({
  recipe,
  onCopy,
  onDelete,
  onToggleFavorite,
}: Props) {
  const navigate = useNavigate();

  const items: ItemCardMenuItem[] = [
    {
      key: "favorite",
      label: recipe.is_favorite ? "Favorited" : "Favorite",
      onClick: () => onToggleFavorite?.(recipe.id),
    },
    {
      key: "edit",
      label: "Edit",
      onClick: () => navigate(`/recipes/${recipe.id}/edit`),
    },
    {
      key: "copy",
      label: "Copy",
      onClick: onCopy,
    },
    {
      key: "delete",
      label: "Delete",
      danger: true,
      confirmMessage: `Are you sure you want to delete "${recipe.name}"? This cannot be undone.`,
      onClick: () => onDelete?.(recipe.id),
    },
  ];

  return <ItemCardActions items={items} ariaLabel="Open recipe actions" />;
}
