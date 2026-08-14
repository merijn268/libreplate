import { useState } from "react";

import { recipesTagsCreate, recipesTagsDestroy } from "@/api/generated";

import type { RecipeTag } from "@/api/generated/types.gen";

import SearchBar, { type SortOption } from "@/components/bars/SearchBar";

import TagModal from "@/components/modals/TagModal";

export type RecipeSortMethod =
  "created_at" | "updated_at" | "name" | "last_used_at";

const SORT_OPTIONS: SortOption<RecipeSortMethod>[] = [
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

  recipeCount: number;

  showFavorites: boolean;
  onToggleFavorites: () => void;

  sortMethod: RecipeSortMethod;
  onSortChange: (value: RecipeSortMethod) => void;

  tags: RecipeTag[];
  selectedTags: number[];
  onTagsChange: (tags: number[]) => void;

  refreshTags: () => void;
}

export default function RecipeSearchBar({
  search,
  onSearchChange,
  recipeCount,
  showFavorites,
  onToggleFavorites,
  sortMethod,
  onSortChange,
  tags,
  selectedTags,
  onTagsChange,
  refreshTags,
}: Props) {
  const [showTagModal, setShowTagModal] = useState(false);

  return (
    <>
      <SearchBar
        search={search}
        onSearchChange={onSearchChange}
        scope={{
          count: recipeCount,
          label: "recipes",
        }}
        showFavorites={showFavorites}
        onToggleFavorites={onToggleFavorites}
        sortMethod={sortMethod}
        onSortChange={onSortChange}
        sortOptions={SORT_OPTIONS}
        tags={tags}
        selectedTags={selectedTags}
        onTagsChange={onTagsChange}
        onManageTags={() => setShowTagModal(true)}
      />

      <TagModal
        open={showTagModal}
        onClose={() => setShowTagModal(false)}
        tags={tags}
        selectedTags={selectedTags}
        onTagsChange={onTagsChange}
        createTag={(name) =>
          recipesTagsCreate({
            body: {
              name,
            },
          })
        }
        deleteTag={(id) =>
          recipesTagsDestroy({
            path: {
              id,
            },
          })
        }
        onChanged={refreshTags}
      />
    </>
  );
}
