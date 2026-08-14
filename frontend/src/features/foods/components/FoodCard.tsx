import { useNavigate } from "react-router-dom";

import type { Food } from "@/api/generated";

import FoodCardActions from "./FoodCardActions";
import ItemCard from "@/components/ItemCard";

interface Props {
  food: Food;
  onDelete?: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
}

export default function FoodCard({ food, onDelete, onToggleFavorite }: Props) {
  const navigate = useNavigate();

  if (!food) {
    return null;
  }

  const energy = food.nutrients?.find(
    (nutrient) => nutrient.nutrient.name.toLowerCase() === "energy",
  );

  return (
    <ItemCard
      title={food.name}
      subtitle={food.brand || "No brand"}
      onClick={() => navigate(`/foods/${food.id}/edit`)}
      actions={
        <FoodCardActions
          food={food}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      }
      meta={
        food.serving != null && (
          <>
            <i className="bi bi-lightning me-1"></i>
            {energy?.amount ?? 0}
            {" kcals"}
            <i className="bi bi-people ms-2 me-1"></i>
            {food.serving} {food.unit.name}
          </>
        )
      }
    />
  );
}
