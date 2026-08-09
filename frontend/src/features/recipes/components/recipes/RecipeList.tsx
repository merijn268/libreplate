import RecipeCard from "./RecipeCard";

import type { Recipe } from "@/api/generated/types.gen";

interface Props {
  recipes: Recipe[];
  onDelete?: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
  onCopy?: (id: number, name: string) => void;
}

export default function RecipeList({
  recipes,
  onDelete,
  onToggleFavorite,
  onCopy,
}: Props) {
  return (
    // TODO create card list component.
    <div className="d-flex flex-column gap-1">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
          onCopy={onCopy}
        />
      ))}
    </div>
  );
}
