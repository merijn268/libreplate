import { useEffect, useState } from "react";

import Modal from "@/components/modals/Modal";
import { modalUiStyles } from "@/components/modals/modalUiStyles";

import {
  mealPlansRandomizersCreate,
  mealPlansRandomizersDestroy,
  mealPlansRandomizersPartialUpdate,
} from "@/api/generated";

import type {
  Food,
  PatchedRandomizerItem,
  PatchedRandomizerItemWritable,
  RandomizerCandidateWritable,
  RandomizerItemWritable,
  Recipe,
} from "@/api/generated";

import FoodPickerModal from "@/features/foods/components/FoodPickerModal";
import RecipePickerModal from "@/features/recipes/components/common/RecipePickermodal";

type Props = {
  isOpen: boolean;
  plannedMealId: number;
  randomizer?: PatchedRandomizerItem | null;
  onClose: () => void;
  onSaved?: (randomizer: PatchedRandomizerItem) => void;
  onDeleted?: (id: number) => void;
};

type CandidateDraft =
  | {
      key: string;
      type: "food";
      food: Food;
      numberOfServings: number;
      servingSize: number;
    }
  | {
      key: string;
      type: "recipe";
      recipe: Recipe;
      numberOfServings: number;
    };

type CandidatePicker = "none" | "food" | "recipe";

export default function RandomizerModal({
  isOpen,
  plannedMealId,
  randomizer,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const isEditing = Boolean(randomizer?.id);

  const [name, setName] = useState("");
  const [candidates, setCandidates] = useState<CandidateDraft[]>([]);
  const [candidatePicker, setCandidatePicker] =
    useState<CandidatePicker>("none");

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = isSaving || isDeleting;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(randomizer?.name ?? "");
    setError(null);
    setCandidatePicker("none");

    setCandidates(
      (randomizer?.candidates ?? []).flatMap(
        (candidate, index): CandidateDraft[] => {
          if (candidate.food_id != null) {
            return [
              {
                key: `food-${candidate.id ?? index}`,
                type: "food",
                food: candidate.food,
                numberOfServings: Number(candidate.number_of_servings ?? 1),
                servingSize: Number(
                  candidate.serving_size ?? candidate.food.serving ?? 0,
                ),
              },
            ];
          }

          if (candidate.recipe_id != null) {
            return [
              {
                key: `recipe-${candidate.id ?? index}`,
                type: "recipe",
                recipe: candidate.recipe,
                numberOfServings: Number(candidate.number_of_servings ?? 1),
              },
            ];
          }

          return [];
        },
      ),
    );
  }, [isOpen, randomizer]);

  const addFoods = (foods: Food[]) => {
    setCandidates((current) => {
      const existingFoodIds = new Set(
        current
          .filter((candidate) => candidate.type === "food")
          .map((candidate) => candidate.food.id),
      );

      const newCandidates = foods
        .filter((food) => !existingFoodIds.has(food.id))
        .map<CandidateDraft>((food) => ({
          key: `food-${food.id}-${crypto.randomUUID()}`,
          type: "food",
          food,
          numberOfServings: 1,
          servingSize: Number(food.serving ?? 0),
        }));

      return [...current, ...newCandidates];
    });

    setCandidatePicker("none");
    setError(null);
  };

  const addRecipe = (recipe: Recipe, servings: number) => {
    setCandidates((current) => {
      const alreadyExists = current.some(
        (candidate) =>
          candidate.type === "recipe" && candidate.recipe.id === recipe.id,
      );

      if (alreadyExists) {
        return current;
      }

      return [
        ...current,
        {
          key: `recipe-${recipe.id}-${crypto.randomUUID()}`,
          type: "recipe",
          recipe,
          numberOfServings: servings,
        },
      ];
    });

    setCandidatePicker("none");
    setError(null);
  };

  const removeCandidate = (key: string) => {
    setCandidates((current) =>
      current.filter((candidate) => candidate.key !== key),
    );
  };

  const updateFoodCandidate = (
    key: string,
    values: {
      servingSize?: number;
      numberOfServings?: number;
    },
  ) => {
    setCandidates((current) =>
      current.map((candidate) => {
        if (candidate.key !== key || candidate.type !== "food") {
          return candidate;
        }

        return {
          ...candidate,
          servingSize: values.servingSize ?? candidate.servingSize,
          numberOfServings:
            values.numberOfServings ?? candidate.numberOfServings,
        };
      }),
    );
  };

  const updateRecipeCandidate = (key: string, numberOfServings: number) => {
    setCandidates((current) =>
      current.map((candidate) => {
        if (candidate.key !== key || candidate.type !== "recipe") {
          return candidate;
        }

        return {
          ...candidate,
          numberOfServings,
        };
      }),
    );
  };

  const getWritableCandidates = (): RandomizerCandidateWritable[] => {
    return candidates.map((candidate) => {
      if (candidate.type === "food") {
        return {
          food_id: candidate.food.id,
          recipe_id: null,
          number_of_servings: String(candidate.numberOfServings),
          serving_size: String(candidate.servingSize),
        };
      }

      return {
        food_id: null,
        recipe_id: candidate.recipe.id,
        number_of_servings: String(candidate.numberOfServings),
        serving_size: null,
      };
    });
  };

  const validate = () => {
    if (!name.trim()) {
      setError("Please enter a name.");
      return false;
    }

    if (candidates.length === 0) {
      setError("Add at least one food or recipe.");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const writableCandidates = getWritableCandidates();

      if (isEditing && randomizer?.id != null) {
        const body: PatchedRandomizerItemWritable = {
          planned_meal_id: plannedMealId,
          name: name.trim(),
          candidates: writableCandidates,
          recurrence: randomizer.recurrence ?? null,
        };

        const response = await mealPlansRandomizersPartialUpdate({
          path: {
            id: randomizer.id,
          },
          body,
        });

        if (response.error) {
          throw new Error("Unable to save randomizer.");
        }

        if (response.data) {
          onSaved?.(response.data);
          onClose();
        }

        return;
      }

      const body: RandomizerItemWritable = {
        planned_meal_id: plannedMealId,
        name: name.trim(),
        candidates: writableCandidates,
        recurrence: null,
      };

      const response = await mealPlansRandomizersCreate({
        body,
      });

      if (response.error) {
        throw new Error("Unable to create randomizer.");
      }

      if (response.data) {
        onSaved?.(response.data);
        onClose();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save randomizer.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!randomizer?.id) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await mealPlansRandomizersDestroy({
        path: {
          id: randomizer.id,
        },
      });

      if (response.error) {
        throw new Error("Unable to delete randomizer.");
      }

      onDeleted?.(randomizer.id);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete randomizer.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        title={isEditing ? "Edit Randomizer" : "Add Randomizer"}
        onClose={onClose}
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="randomizer-name"
              className="mb-1 block text-sm font-medium"
            >
              Name
            </label>

            <input
              id="randomizer-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Dinner"
              disabled={disabled}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Candidates</span>

              <span className="text-xs opacity-60">
                {candidates.length}{" "}
                {candidates.length === 1 ? "candidate" : "candidates"}
              </span>
            </div>

            <div className="space-y-2">
              {candidates.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm opacity-60">
                  No candidates added yet.
                </div>
              ) : (
                candidates.map((candidate) => (
                  <div key={candidate.key} className="rounded-md border p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100">
                        <i
                          className={
                            candidate.type === "food"
                              ? "bi bi-cake2"
                              : "bi bi-journal-text"
                          }
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-medium">
                          {candidate.type === "food"
                            ? candidate.food.name
                            : candidate.recipe.name}
                        </div>

                        <div className="mt-1 text-xs opacity-60">
                          {candidate.type === "food" ? "Food" : "Recipe"}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={candidate.numberOfServings}
                            onChange={(event) => {
                              const value = Number(event.target.value);

                              if (candidate.type === "food") {
                                updateFoodCandidate(candidate.key, {
                                  numberOfServings: value,
                                });
                              } else {
                                updateRecipeCandidate(candidate.key, value);
                              }
                            }}
                            disabled={disabled}
                            className="w-28 rounded-md border px-2 py-2"
                            aria-label="Number of servings"
                          />

                          {candidate.type === "food" && (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={candidate.servingSize}
                              onChange={(event) =>
                                updateFoodCandidate(candidate.key, {
                                  servingSize: Number(event.target.value),
                                })
                              }
                              disabled={disabled}
                              className="w-32 rounded-md border px-2 py-2"
                              aria-label="Serving size"
                            />
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeCandidate(candidate.key)}
                        disabled={disabled}
                        className="shrink-0 rounded-md border border-red-300 px-3 py-2 text-red-600"
                        aria-label={`Remove ${
                          candidate.type === "food"
                            ? candidate.food.name
                            : candidate.recipe.name
                        }`}
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setCandidatePicker("food")}
                disabled={disabled}
                className="rounded-md border px-3 py-2"
              >
                <i className="bi bi-cake2 mr-2" />
                Add Food
              </button>

              <button
                type="button"
                onClick={() => setCandidatePicker("recipe")}
                disabled={disabled}
                className="rounded-md border px-3 py-2"
              >
                <i className="bi bi-journal-text mr-2" />
                Add Recipe
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className={modalUiStyles.list.container}>
            <button
              type="button"
              onClick={() => {
                void handleSave();
              }}
              disabled={disabled}
              className="flex w-full items-center gap-3 rounded-md border px-4 py-3"
            >
              <i className="bi bi-check-lg" />

              <span>
                {isSaving
                  ? "Saving..."
                  : isEditing
                    ? "Save changes"
                    : "Add randomizer"}
              </span>
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  void handleDelete();
                }}
                disabled={disabled}
                className="flex w-full items-center gap-3 rounded-md border border-red-300 px-4 py-3 text-red-600"
              >
                <i className="bi bi-trash" />

                <span>{isDeleting ? "Deleting..." : "Delete randomizer"}</span>
              </button>
            )}
          </div>
        </div>
      </Modal>

      <FoodPickerModal
        isOpen={candidatePicker === "food"}
        onClose={() => setCandidatePicker("none")}
        onSelect={addFoods}
      />

      <RecipePickerModal
        isOpen={candidatePicker === "recipe"}
        onClose={() => setCandidatePicker("none")}
        onSelect={addRecipe}
      />
    </>
  );
}
