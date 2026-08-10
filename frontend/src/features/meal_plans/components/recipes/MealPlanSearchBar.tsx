import SearchBar, { type SortOption } from "@/components/ui/bars/SearchBar";

export type MealPlanSortMethod =
  "created_at" | "updated_at" | "name" | "last_used_at";

const SORT_OPTIONS: SortOption<MealPlanSortMethod>[] = [
  {
    value: "created_at",
    label: "Created at",
  },
  {
    value: "updated_at",
    label: "Updated at",
  },
  {
    value: "name",
    label: "Name",
  },
  {
    value: "last_used_at",
    label: "Last used at",
  },
];

interface Props {
  search: string;
  onSearchChange: (value: string) => void;

  mealPlanCount: number;

  showFavorites: boolean;
  onToggleFavorites: () => void;

  sortMethod: MealPlanSortMethod;
  onSortChange: (value: MealPlanSortMethod) => void;
}

export default function MealPlanSearchBar({
  search,
  onSearchChange,
  mealPlanCount,
  showFavorites,
  onToggleFavorites,
  sortMethod,
  onSortChange,
}: Props) {
  return (
    <SearchBar
      search={search}
      onSearchChange={onSearchChange}
      scope={{
        count: mealPlanCount,
        label: "meal plans",
      }}
      showFavorites={showFavorites}
      onToggleFavorites={onToggleFavorites}
      sortMethod={sortMethod}
      onSortChange={onSortChange}
      sortOptions={SORT_OPTIONS}
    />
  );
}
