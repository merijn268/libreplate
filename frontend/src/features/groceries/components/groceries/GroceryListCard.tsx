import { useNavigate } from "react-router-dom";

import type { GroceryList } from "@/api/generated/types.gen";

import ItemCard from "@/components/ItemCard";
import GroceryListCardActions from "./GroceryListCardActions";

interface Props {
  groceryList: GroceryList;
  onDelete?: (id: number) => void;
  onToggleFavorite?: (id: number, isFavorite: boolean) => void;
}

export default function GroceryListCard({
  groceryList,
  onDelete,
  onToggleFavorite,
}: Props) {
  const navigate = useNavigate();

  return (
    <ItemCard
      title={groceryList.name}
      onClick={() => navigate(`/groceries/${groceryList.id}/edit`)}
      actions={
        <GroceryListCardActions
          groceryList={groceryList}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      }
      meta={<>{groceryList.description}</>}
    />
  );
}
