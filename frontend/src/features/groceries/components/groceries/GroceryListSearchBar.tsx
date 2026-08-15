import SearchBar, { type SortOption } from "@/components/bars/SearchBar";

export type GroceryListSortMethod = "created_at" | "updated_at" | "name";

const SORT_OPTIONS: SortOption<GroceryListSortMethod>[] = [
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
];

interface Props {
  search: string;
  onSearchChange: (value: string) => void;

  groceryListCount: number;

  showFavorites: boolean;
  onToggleFavorites: () => void;

  sortMethod: GroceryListSortMethod;
  onSortChange: (value: GroceryListSortMethod) => void;
}

export default function GroceryListSearchBar({
  search,
  onSearchChange,
  groceryListCount,
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
        count: groceryListCount,
        label: "grocery lists",
      }}
      showFavorites={showFavorites}
      onToggleFavorites={onToggleFavorites}
      sortMethod={sortMethod}
      onSortChange={onSortChange}
      sortOptions={SORT_OPTIONS}
    />
  );
}
