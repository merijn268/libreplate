import { useState } from "react";
import { useNavigate } from "react-router-dom";

import type { PlannedMealEntryRecurrence, Recipe } from "@/api/generated";

import Modal from "@/components/modals/Modal";
import { modalUiStyles } from "@/components/modals/modalUiStyles";

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
  onDelete: () => Promise<void>;
};

export default function EditRecipeAmountModal({
  recipe,
  numberOfServings,
  recurrence,
  onClose,
  onEditRecurrence,
  onSave,
  onDelete,
}: Props) {
  const navigate = useNavigate();

  const [currentNumberOfServings, setCurrentNumberOfServings] = useState(
    String(numberOfServings),
  );

  const [isDeleting, setIsDeleting] = useState(false);

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

  async function handleDelete() {
    setIsDeleting(true);

    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
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
      onClose={isDeleting ? () => undefined : onClose}
      footer={
        <div className={modalUiStyles.footer.container}>
          <button
            type="button"
            className={modalUiStyles.buttons.danger}
            onClick={() => void handleDelete()}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>

          <div className={modalUiStyles.footer.actions}>
            <button
              type="button"
              className={modalUiStyles.buttons.secondary}
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </button>

            <button
              type="button"
              className={modalUiStyles.buttons.primary}
              disabled={!hasValidInputs || isDeleting}
              onClick={() => void handleSave()}
            >
              Save
            </button>
          </div>
        </div>
      }
    >
      <div className={modalUiStyles.form.fields}>
        <div className={modalUiStyles.form.field}>
          <div className={modalUiStyles.form.labelRow}>
            <label
              htmlFor="number-of-servings"
              className={`${modalUiStyles.form.label} ${
                !hasValidInputs ? modalUiStyles.form.error : ""
              }`}
            >
              Servings
            </label>

            {!hasValidInputs && (
              <span className={modalUiStyles.form.errorMessage}>
                (Enter a valid number)
              </span>
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
            disabled={isDeleting}
          />
        </div>

        <div className={modalUiStyles.list.container}>
          <button
            type="button"
            className={modalUiStyles.list.action}
            onClick={handleEditRecipe}
            disabled={isDeleting}
          >
            <div className={modalUiStyles.list.actionContent}>
              <span className={modalUiStyles.list.actionLabel}>
                <i
                  className={`bi bi-book me-2 ${modalUiStyles.list.actionIcon}`}
                />
                Edit recipe
              </span>

              <span className={modalUiStyles.list.actionMeta}>
                <i
                  className={`bi bi-chevron-right ${modalUiStyles.list.actionIcon}`}
                  aria-hidden="true"
                />
              </span>
            </div>
          </button>

          {onEditRecurrence != null && (
            <button
              type="button"
              className={modalUiStyles.list.action}
              onClick={onEditRecurrence}
              disabled={isDeleting}
            >
              <div className={modalUiStyles.list.actionContent}>
                <div className="text-start">
                  <i
                    className={`bi bi-arrow-repeat me-2 ${modalUiStyles.list.actionIcon}`}
                  />
                  <span className={modalUiStyles.list.actionLabel}>
                    Recurrence
                  </span>
                </div>

                <span className={modalUiStyles.list.actionMeta}>
                  <i
                    className={`bi bi-chevron-right ${modalUiStyles.list.actionIcon}`}
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
