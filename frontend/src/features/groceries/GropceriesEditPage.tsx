import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import GroceryItemList from "./components/edit/GroceryItemList";

import {
  groceriesItemsList,
  groceriesItemsToggleCreate,
  groceriesRetrieve,
} from "@/api/generated";
import type { GroceryListFoodWritable } from "@/api/generated/types.gen";

export default function GroceriesEditPage() {
  const { id } = useParams<{ id: string }>();
  const groceryListId = Number(id);
  const queryClient = useQueryClient();

  const invalidateItems = () =>
    queryClient.invalidateQueries({
      queryKey: ["grocery-items", groceryListId],
    });

  const groceryListQuery = useQuery({
    queryKey: ["groceries", groceryListId],
    queryFn: () =>
      groceriesRetrieve({
        path: {
          id: groceryListId,
        },
      }),
  });

  const itemsQuery = useQuery({
    queryKey: ["grocery-items", groceryListId],
    // NOTE: the generated path type also requires an `id`, even though the
    // actual endpoint (`/api/groceries/{grocery_pk}/items/`) only uses
    // `grocery_pk`. Passing the grocery list id for both satisfies the
    // type; only `grocery_pk` is actually used to build the request URL.
    queryFn: () =>
      groceriesItemsList({
        path: {
          grocery_pk: groceryListId,
          id: groceryListId,
        },
      }),
  });

  const toggleItem = useMutation({
    mutationFn: (itemId: number) =>
      groceriesItemsToggleCreate({
        path: {
          grocery_pk: groceryListId,
          id: itemId,
        },
        // The toggle endpoint flips `on_hand` server-side and ignores the
        // request body, but the generated types still require one.
        body: {} as GroceryListFoodWritable,
      }),
    onSuccess: invalidateItems,
  });

  if (groceryListQuery.isPending || itemsQuery.isPending) {
    return <div>Loading...</div>;
  }

  if (groceryListQuery.isError || itemsQuery.isError) {
    return <div>Failed to load grocery list.</div>;
  }

  const groceryList = groceryListQuery.data.data;
  const items = itemsQuery.data.data ?? [];

  if (!groceryList) {
    return <div>Grocery list not found.</div>;
  }

  return (
    <div className="container">
      <h1>{groceryList.name}</h1>
      {groceryList.description && <p>{groceryList.description}</p>}

      <GroceryItemList
        items={items}
        onToggle={(itemId) => toggleItem.mutate(itemId)}
      />
    </div>
  );
}
