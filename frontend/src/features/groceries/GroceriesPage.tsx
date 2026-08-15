import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import GroceryListList from "./components/groceries/GroceryListList";
import GroceryListSearchBar, {
  type GroceryListSortMethod,
} from "./components/groceries/GroceryListSearchBar";
import FloatingAddButton from "@/components/buttons/FloatingAddButton";

import {
  groceriesDestroy,
  groceriesGenerateCreate,
  groceriesList,
  groceriesPartialUpdate,
} from "@/api/generated";
import type { GroceryListGenerate } from "@/api/generated/types.gen";

export default function GroceriesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const invalidateGroceryLists = () =>
    queryClient.invalidateQueries({
      queryKey: ["groceries"],
    });

  const groceriesQuery = useQuery({
    queryKey: ["groceries"],
    queryFn: () => groceriesList(),
  });

  const deleteGroceryList = useMutation({
    mutationFn: (id: number) =>
      groceriesDestroy({
        path: {
          id,
        },
      }),
    onSuccess: invalidateGroceryLists,
  });

  const toggleFavorite = useMutation({
    mutationFn: ({ id, isFavorite }: { id: number; isFavorite: boolean }) =>
      groceriesPartialUpdate({
        path: {
          id,
        },
        body: {
          is_favorite: !isFavorite,
        },
      }),
    onSuccess: invalidateGroceryLists,
  });

  const generateGroceryList = useMutation({
    // NOTE: GroceryListGenerate's real fields weren't available in the API
    // types provided, so this assumes an empty body works (e.g. the backend
    // generates from the current/active meal plan). Fill in fields here if
    // the endpoint actually requires them (e.g. a meal_plan id).
    mutationFn: () =>
      groceriesGenerateCreate({
        body: {} as GroceryListGenerate,
      }),
    onSuccess: invalidateGroceryLists,
  });

  const [search, setSearch] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [sortMethod, setSortMethod] =
    useState<GroceryListSortMethod>("created_at");

  if (groceriesQuery.isPending) {
    return <div>Loading...</div>;
  }

  if (groceriesQuery.isError) {
    return <div>Failed to load grocery lists.</div>;
  }

  const groceryLists = groceriesQuery.data.data ?? [];

  function handleAddGroceryList() {
    generateGroceryList.mutate(undefined, {
      onSuccess: (response) => {
        if (!response.data) {
          return;
        }

        navigate(`/groceries/${response.data.id}/edit`);
      },
    });
  }

  const filteredGroceryLists = groceryLists
    .filter((groceryList) => {
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        groceryList.name.toLowerCase().includes(searchTerm) ||
        groceryList.description?.toLowerCase().includes(searchTerm);

      const matchesFavorite = !showFavorites || groceryList.is_favorite;

      return matchesSearch && matchesFavorite;
    })
    .sort((a, b) => {
      switch (sortMethod) {
        case "name":
          return a.name.localeCompare(b.name);

        case "created_at":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

        case "updated_at":
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );

        default:
          return 0;
      }
    });

  return (
    <div className="container">
      <GroceryListSearchBar
        search={search}
        onSearchChange={setSearch}
        groceryListCount={filteredGroceryLists.length}
        showFavorites={showFavorites}
        onToggleFavorites={() => setShowFavorites((value) => !value)}
        sortMethod={sortMethod}
        onSortChange={setSortMethod}
      />

      <div className="mt-2">
        <GroceryListList
          groceryLists={filteredGroceryLists}
          onDelete={(id: number) => deleteGroceryList.mutate(id)}
          onToggleFavorite={(id: number, isFavorite: boolean) =>
            toggleFavorite.mutate({
              id,
              isFavorite,
            })
          }
        />
      </div>

      <FloatingAddButton
        onClick={handleAddGroceryList}
        disabled={generateGroceryList.isPending}
      />
    </div>
  );
}
