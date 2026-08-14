import { useState } from "react";
import { useNavigate } from "react-router-dom";

import type { PlannedMealEntryRecurrence, Recipe } from "@/api/generated";
import Modal from "@/components/ui/modals/Modal";

type Props = {
  recipe: Recipe;
  numberOfServings: number;
  recurrence?: PlannedMealEntryRecurrence;
  onClose: () => void;
  onEditRecurrence?: () => void;
  onSave: (values: {
    number_of_servings: number;
    recurrence?: PlannedMealEntryRecurrence;
  }) => Promise<void>;
};

export default function EditRecipeAmountModal({
  recipe,
  numberOfServings,
  recurrence,
  onClose,
  onEditRecurrence,
  onSave,
}: Props) {
  const navigate = useNavigate();

  const [currentNumberOfServings, setCurrentNumberOfServings] = useState(
    String(numberOfServings),
  );

  const parsedServings = Number.parseFloat(currentNumberOfServings);
  const hasValidInputs = !Number.isNaN(parsedServings) && parsedServings >= 0;

  async function handleSave() {
    if (!hasValidInputs) {
      return;
    }

    await onSave({
      number_of_servings: parsedServings,
      recurrence,
    });

    onClose();
  }

  function handleEditRecipe() {
    onClose();

    navigate(`/recipes/${recipe.id}/edit`, {
      state: {
        from: window.location.pathname + window.location.search,
      },
    });
  }

  return (
    <Modal
      isOpen
      title={recipe.name}
      onClose={onClose}
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-sm btn-light"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-sm btn-primary px-3"
            disabled={!hasValidInputs}
            onClick={() => void handleSave()}
          >
            Save
          </button>
        </div>
      }
    >
      <div className="d-flex flex-column gap-3">
        <div className="mt-2">
          <div className="d-flex align-items-center gap-2 mb-1">
            <label
              htmlFor="number-of-servings"
              className={`form-label mb-0 ${!hasValidInputs ? "text-danger" : ""}`}
            >
              Servings
            </label>

            {!hasValidInputs && (
              <span className="text-danger small">(Enter a valid number)</span>
            )}
          </div>

          <input
            id="number-of-servings"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            className="form-control"
            value={currentNumberOfServings}
            onChange={(event) => setCurrentNumberOfServings(event.target.value)}
          />
        </div>

        <div className="list-group list-group-flush border rounded overflow-hidden">
          <button
            type="button"
            className="list-group-item list-group-item-action px-3 py-2"
            onClick={handleEditRecipe}
          >
            <div className="d-flex align-items-center justify-content-between">
              <span className="fw-medium">
                <i className="bi bi-book me-2 text-primary"></i>
                Edit recipe
              </span>

              <span className="text-muted small d-flex align-items-center gap-1">
                <i
                  className="bi bi-chevron-right text-primary"
                  aria-hidden="true"
                />
              </span>
            </div>
          </button>

          {onEditRecurrence != null && (
            <button
              type="button"
              className="list-group-item list-group-item-action px-3 py-2"
              onClick={onEditRecurrence}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div className="text-start">
                  <i className="bi bi-arrow-repeat me-2 text-primary"></i>
                  <span className="fw-medium">Recurrence</span>
                </div>

                <span className="text-muted small d-flex align-items-center gap-1">
                  <i
                    className="bi bi-chevron-right text-primary"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
