import { useNavigate } from "react-router-dom";

import type { Recipe } from "@/api/generated/types.gen";

import ItemCard from "@/components/ui/ItemCard";
import RecipeCardActions from "./RecipeCardActions";

interface Props {
  recipe: Recipe;
  onDelete?: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
  onCopy?: (id: number, name: string) => void;
}

export default function RecipeCard({
  recipe,
  onDelete,
  onToggleFavorite,
  onCopy,
}: Props) {
  const navigate = useNavigate();

  function handleCopy() {
    const name = window.prompt("New recipe name:", `${recipe.name} Copy`);

    if (name) {
      onCopy?.(recipe.id, name);
    }
  }

  const energy = recipe.nutrients.find(
    (nutrient) => nutrient.name.toLowerCase() === "energy",
  );

  return (
    <ItemCard
      title={recipe.name}
      onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
      actions={
        <RecipeCardActions
          recipe={recipe}
          onCopy={handleCopy}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      }
      meta={
        <>
          <i className="bi bi-lightning me-1"></i>
          {energy?.amount ?? 0}
          {" kcals"}
          <i className="bi bi-people ms-2 me-1"></i>
          {recipe.portions ?? 0}
          <i className="bi bi-clock ms-2 me-1"></i>
          {recipe.cooking_time ?? 0}
          {"m"}
        </>
      }
    />
  );
}
