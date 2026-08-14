import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import RecipeList from "./components/recipes/RecipeList";
import RecipeSearchBar, {
  type RecipeSortMethod,
} from "./components/recipes/RecipeSearchBar";
import FloatingAddButton from "@/components/ui/buttons/FloatingAddButton";

import {
  recipesCopyCreate,
  recipesCreate,
  recipesDestroy,
  recipesList,
  recipesTagsList,
  recipesToggleFavoriteCreate,
} from "@/api/generated";

export default function RecipePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const invalidateRecipes = () =>
    queryClient.invalidateQueries({
      queryKey: ["recipes"],
    });

  const refreshTags = () =>
    queryClient.invalidateQueries({
      queryKey: ["recipe-tags"],
    });

  const recipesQuery = useQuery({
    queryKey: ["recipes"],
    queryFn: () => recipesList(),
  });

  const tagsQuery = useQuery({
    queryKey: ["recipe-tags"],
    queryFn: () => recipesTagsList(),
  });

  const deleteRecipe = useMutation({
    mutationFn: (id: number) =>
      recipesDestroy({
        path: {
          id,
        },
      }),
    onSuccess: invalidateRecipes,
  });

  const toggleFavorite = useMutation({
    mutationFn: (id: number) =>
      recipesToggleFavoriteCreate({
        path: {
          id,
        },
        body: {} as never,
      }),
    onSuccess: invalidateRecipes,
  });

  const copyRecipe = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      recipesCopyCreate({
        path: {
          id,
        },
        body: {
          name,
        } as never,
      }),
    onSuccess: invalidateRecipes,
  });

  const createRecipe = useMutation({
    mutationFn: () =>
      recipesCreate({
        body: {
          name: "New recipe",
          description: "",
          instructions: "",
          cooking_time: "0",
          prepping_time: "0",
          portions: 1,
        },
      }),
    onSuccess: invalidateRecipes,
  });

  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [sortMethod, setSortMethod] = useState<RecipeSortMethod>("created_at");

  if (recipesQuery.isPending) {
    return <div className="container py-3">Loading...</div>;
  }

  if (recipesQuery.isError) {
    return <div className="container py-3">Failed to load recipes.</div>;
  }

  const recipes = recipesQuery.data.data ?? [];
  const tags = tagsQuery.data?.data ?? [];

  function handleAddRecipe() {
    createRecipe.mutate(undefined, {
      onSuccess: (response) => {
        if (!response.data) {
          return;
        }

        navigate(`/recipes/${response.data.id}/edit`);
      },
    });
  }

  const filteredRecipes = recipes
    .filter((recipe) => {
      const searchTerm = search.toLowerCase();

      const matchesSearch = recipe.name.toLowerCase().includes(searchTerm);

      const matchesFavorite = !showFavorites || recipe.is_favorite;

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tagId) =>
          recipe.tags.some((tag) => tag.id === tagId),
        );

      return matchesSearch && matchesFavorite && matchesTags;
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

        case "last_used_at":
          if (!a.last_used_at) {
            return 1;
          }

          if (!b.last_used_at) {
            return -1;
          }

          return (
            new Date(b.last_used_at).getTime() -
            new Date(a.last_used_at).getTime()
          );

        default:
          return 0;
      }
    });

  return (
    <div className="container">
      <div className="mb-3">
        <RecipeSearchBar
          search={search}
          onSearchChange={setSearch}
          recipeCount={filteredRecipes.length}
          showFavorites={showFavorites}
          onToggleFavorites={() => setShowFavorites((value) => !value)}
          sortMethod={sortMethod}
          onSortChange={setSortMethod}
          tags={tags}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          refreshTags={refreshTags}
        />
      </div>

      <div className="mt-2">
        <RecipeList
          recipes={filteredRecipes}
          onDelete={(id) => deleteRecipe.mutate(id)}
          onToggleFavorite={(id) => toggleFavorite.mutate(id)}
          onCopy={(id, name) =>
            copyRecipe.mutate({
              id,
              name,
            })
          }
        />
      </div>

      <FloatingAddButton
        onClick={handleAddRecipe}
        disabled={createRecipe.isPending}
      />
    </div>
  );
}
