import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import MealPlanList from "./components/meal_plans/MealPlanList";
import MealPlanSearchBar, {
  type MealPlanSortMethod,
} from "./components/meal_plans/MealPlanSearchBar";
import RoundAddButton from "@/components/ui/RoundAddButton";

import {
  mealPlansCreate,
  mealPlansDestroy,
  mealPlansList,
  mealPlansMarkFavoriteCreate,
  mealPlansUnmarkFavoriteCreate,
} from "@/api/generated";

export default function MealPlansPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const invalidateMealPlans = () =>
    queryClient.invalidateQueries({
      queryKey: ["meal-plans"],
    });

  const mealPlansQuery = useQuery({
    queryKey: ["meal-plans"],
    queryFn: () => mealPlansList(),
  });

  const deleteMealPlan = useMutation({
    mutationFn: (id: number) =>
      mealPlansDestroy({
        path: {
          id,
        },
      }),
    onSuccess: invalidateMealPlans,
  });

  const toggleFavorite = useMutation({
    mutationFn: ({ id, isFavorite }: { id: number; isFavorite: boolean }) =>
      isFavorite
        ? mealPlansUnmarkFavoriteCreate({
            path: {
              id,
            },
            body: {} as never,
          })
        : mealPlansMarkFavoriteCreate({
            path: {
              id,
            },
            body: {} as never,
          }),
    onSuccess: invalidateMealPlans,
  });

  const createMealPlan = useMutation({
    mutationFn: () =>
      mealPlansCreate({
        body: {
          name: "New meal plan",
          description: "",
        },
      }),
    onSuccess: invalidateMealPlans,
  });

  const [search, setSearch] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [sortMethod, setSortMethod] =
    useState<MealPlanSortMethod>("created_at");

  if (mealPlansQuery.isPending) {
    return <div>Loading...</div>;
  }

  if (mealPlansQuery.isError) {
    return <div>Failed to load meal plans.</div>;
  }

  const mealPlans = mealPlansQuery.data.data ?? [];

  function handleAddMealPlan() {
    createMealPlan.mutate(undefined, {
      onSuccess: (response) => {
        if (!response.data) {
          return;
        }

        navigate(`/meal-plans/${response.data.id}/edit`);
      },
    });
  }

  const filteredMealPlans = mealPlans
    .filter((mealPlan) => {
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        mealPlan.name.toLowerCase().includes(searchTerm) ||
        mealPlan.description?.toLowerCase().includes(searchTerm);

      const matchesFavorite = !showFavorites || mealPlan.is_favorite;

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
      <MealPlanSearchBar
        search={search}
        onSearchChange={setSearch}
        mealPlanCount={filteredMealPlans.length}
        showFavorites={showFavorites}
        onToggleFavorites={() => setShowFavorites((value) => !value)}
        sortMethod={sortMethod}
        onSortChange={setSortMethod}
      />

      <div className="mt-2">
        <MealPlanList
          mealPlans={filteredMealPlans}
          onDelete={(id) => deleteMealPlan.mutate(id)}
          onToggleFavorite={(id, isFavorite) =>
            toggleFavorite.mutate({
              id,
              isFavorite,
            })
          }
        />
      </div>

      <RoundAddButton
        onClick={handleAddMealPlan}
        disabled={createMealPlan.isPending}
      />
    </div>
  );
}
