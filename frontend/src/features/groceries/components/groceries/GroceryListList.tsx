import GroceryListCard from "./GroceryListCard";

import type { GroceryList } from "@/api/generated/types.gen";

interface Props {
  groceryLists: GroceryList[];
  onDelete?: (id: number) => void;
  onToggleFavorite?: (id: number, isFavorite: boolean) => void;
}

export default function GroceryListList({
  groceryLists,
  onDelete,
  onToggleFavorite,
}: Props) {
  return (
    <>
      {groceryLists.map((groceryList) => (
        <GroceryListCard
          key={groceryList.id}
          groceryList={groceryList}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </>
  );
}
