import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { RecipeTag } from "@/api/generated/types.gen";

import {
  recipesPartialUpdate,
  recipesRetrieve,
  recipesTagsCreate,
  recipesTagsDestroy,
  recipesTagsList,
} from "@/api/generated";

import RecipeDetailsForm from "./components/edit/RecipeDetailsForm";
import IngredientsCard from "./components/edit/IngredientsCard";
import TagModal from "../../components/modals/TagModal";

type LocationState = {
  from?: string;
};

export default function RecipeEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const recipeId = Number(id);

  const [showTagModal, setShowTagModal] = useState(false);

  const locationState = location.state as LocationState | null;

  const { data: recipeResponse, isLoading } = useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: () =>
      recipesRetrieve({
        path: {
          id: recipeId,
        },
      }),
    enabled: Number.isFinite(recipeId),
  });

  const { data: tagsResponse } = useQuery({
    queryKey: ["recipe-tags"],
    queryFn: () => recipesTagsList(),
  });

  const recipe = recipeResponse?.data;

  const tags: RecipeTag[] = Array.isArray(tagsResponse)
    ? tagsResponse
    : Array.isArray(tagsResponse?.data)
      ? tagsResponse.data
      : [];

  const updateTags = useMutation({
    mutationFn: (tag_ids: number[]) =>
      recipesPartialUpdate({
        path: {
          id: recipeId,
        },
        body: {
          tag_ids,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["recipe", recipeId],
      });

      queryClient.invalidateQueries({
        queryKey: ["recipes"],
      });
    },
  });

  function refreshTags() {
    queryClient.invalidateQueries({
      queryKey: ["recipe-tags"],
    });
  }

  function handleTagsChange(tagIds: number[]) {
    updateTags.mutate(tagIds);
  }

  function handleBack() {
    if (locationState?.from != null) {
      navigate(locationState.from);
      return;
    }

    navigate(-1);
  }

  if (isLoading || !recipe) {
    return <div className="container py-4">Loading...</div>;
  }

  return (
    <div className="container">
      <div>
        <div className="d-flex gap-2 mb-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={handleBack}
          >
            <i className="bi bi-arrow-left me-2" />
            Back
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setShowTagModal(true)}
          >
            <i className="bi bi-tags" />
          </button>
        </div>

        <RecipeDetailsForm recipe={recipe} />
      </div>

      <IngredientsCard recipe={recipe} />

      <TagModal
        open={showTagModal}
        onClose={() => setShowTagModal(false)}
        tags={tags}
        selectedTags={recipe.tags.map((tag) => tag.id)}
        onTagsChange={handleTagsChange}
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
    </div>
  );
}
