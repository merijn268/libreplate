import { useState } from "react";

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

function formatRecurrence(recurrence?: PlannedMealEntryRecurrence): string {
  if (recurrence == null) {
    return "No recurrence";
  }

  const count = recurrence.interval_count ?? 1;
  const interval = recurrence.interval ?? "week";

  const intervalLabel =
    interval === "day"
      ? count === 1
        ? "day"
        : "days"
      : count === 1
        ? "week"
        : "weeks";

  return `Every ${count} ${intervalLabel}`;
}

export default function EditRecipeAmountModal({
  recipe,
  numberOfServings,
  recurrence,
  onClose,
  onEditRecurrence,
  onSave,
}: Props) {
  const [currentNumberOfServings, setCurrentNumberOfServings] = useState(
    String(numberOfServings),
  );

  const parsedServings = Number.parseFloat(currentNumberOfServings);

  const hasValidInputs = !Number.isNaN(parsedServings) && parsedServings > 0;

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

  return (
    <Modal
      isOpen
      title={recipe.name}
      onClose={onClose}
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-primary"
            disabled={!hasValidInputs}
            onClick={() => void handleSave()}
          >
            Save
          </button>
        </div>
      }
    >
      <div className="d-flex flex-column gap-3">
        <div>
          <label className="form-label">Number of servings</label>

          <input
            type="number"
            min={0}
            step="any"
            className="form-control"
            value={currentNumberOfServings}
            onChange={(event) => setCurrentNumberOfServings(event.target.value)}
          />
        </div>

        {onEditRecurrence != null && (
          <div className="border rounded p-3">
            <div className="d-flex align-items-center justify-content-between gap-3">
              <div>
                <div className="fw-semibold">Recurrence</div>
                <div className="text-muted small">
                  {formatRecurrence(recurrence)}
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={onEditRecurrence}
              >
                Edit recurrence
              </button>
            </div>
          </div>
        )}

        {!hasValidInputs && (
          <div className="text-danger small">
            Enter a valid number of servings.
          </div>
        )}
      </div>
    </Modal>
  );
}
