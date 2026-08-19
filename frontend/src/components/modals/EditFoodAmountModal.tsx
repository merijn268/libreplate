import { useMemo, useState } from "react";

import type { Food, PlannedMealEntryRecurrence } from "@/api/generated";
import MacroPieChart from "@/components/MacroPieChart";
import Modal from "@/components/modals/Modal";
import { modalUiStyles } from "@/components/modals/modalUiStyles";

type Props = {
  food: Food;
  servingSize: number;
  numberOfServings: number;
  recurrence?: PlannedMealEntryRecurrence;
  onClose: () => void;
  onEditRecurrence?: () => void;
  onSave: (values: {
    serving_size: number;
    number_of_servings: number;
    recurrence?: PlannedMealEntryRecurrence;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
};

type NutrientTotals = {
  energy: number;
  protein: number;
  fat: number;
  carbs: number;
};

function computeFoodNutrients(
  food: Food,
  servingSize: number,
  numberOfServings: number,
): NutrientTotals {
  const totals: NutrientTotals = {
    energy: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  };

  const multiplier = (servingSize * numberOfServings) / 100;

  for (const nutrient of food.nutrients ?? []) {
    const amount = nutrient.amount * multiplier;

    switch (nutrient.nutrient.name?.toLowerCase()) {
      case "energy":
      case "calories":
      case "kcal":
        totals.energy += amount;
        break;

      case "protein":
        totals.protein += amount;
        break;

      case "fat":
      case "total lipid (fat)":
        totals.fat += amount;
        break;

      case "carbohydrates":
      case "carbs":
      case "carbohydrate, by difference":
        totals.carbs += amount;
        break;
    }
  }

  return totals;
}

function formatAmount(value: number) {
  return Number.isFinite(value) ? value.toFixed(0) : "—";
}

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

export default function EditFoodAmountModal({
  food,
  servingSize,
  numberOfServings,
  recurrence,
  onClose,
  onEditRecurrence,
  onSave,
  onDelete,
}: Props) {
  const [currentServingSize, setCurrentServingSize] = useState(
    String(servingSize),
  );

  const [currentNumberOfServings, setCurrentNumberOfServings] = useState(
    String(numberOfServings),
  );

  const [isDeleting, setIsDeleting] = useState(false);

  const parsedSize = Number.parseFloat(currentServingSize);
  const parsedServings = Number.parseFloat(currentNumberOfServings);

  const hasValidInputs =
    !Number.isNaN(parsedSize) &&
    !Number.isNaN(parsedServings) &&
    parsedSize > 0 &&
    parsedServings > 0;

  const nutrients = useMemo(() => {
    if (!hasValidInputs) {
      return computeFoodNutrients(food, 0, 0);
    }

    return computeFoodNutrients(food, parsedSize, parsedServings);
  }, [food, parsedSize, parsedServings, hasValidInputs]);

  async function handleSave() {
    if (!hasValidInputs) {
      return;
    }

    await onSave({
      serving_size: parsedSize,
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

  return (
    <Modal
      isOpen
      title={food.name}
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
              onClick={() => void handleSave()}
              disabled={!hasValidInputs || isDeleting}
            >
              Save
            </button>
          </div>
        </div>
      }
    >
      <div className={modalUiStyles.form.fields}>
        <div className="d-flex gap-3">
          <div className="w-50">
            <label className={modalUiStyles.form.label}>Serving size (g)</label>

            <input
              type="number"
              min={0}
              step="any"
              className="form-control"
              value={currentServingSize}
              onChange={(event) => setCurrentServingSize(event.target.value)}
              disabled={isDeleting}
            />
          </div>

          <div className="w-50">
            <label className={modalUiStyles.form.label}>
              Number of servings
            </label>

            <input
              type="number"
              min={0}
              step="any"
              className="form-control"
              value={currentNumberOfServings}
              onChange={(event) =>
                setCurrentNumberOfServings(event.target.value)
              }
              disabled={isDeleting}
            />
          </div>
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
                className={modalUiStyles.buttons.secondary}
                onClick={onEditRecurrence}
                disabled={isDeleting}
              >
                Edit recurrence
              </button>
            </div>
          </div>
        )}

        <div className="border rounded p-3">
          <MacroPieChart
            protein={nutrients.protein}
            fat={nutrients.fat}
            carbs={nutrients.carbs}
          />

          <div className="fw-semibold mb-2 mt-3">Nutrients</div>

          <div className="d-flex flex-column gap-1 small">
            <div className="d-flex justify-content-between">
              <span>Energy (kcals)</span>
              <span>{formatAmount(nutrients.energy)}</span>
            </div>

            <div className="d-flex justify-content-between">
              <span>Protein (g)</span>
              <span>{formatAmount(nutrients.protein)}</span>
            </div>

            <div className="d-flex justify-content-between">
              <span>Fat (g)</span>
              <span>{formatAmount(nutrients.fat)}</span>
            </div>

            <div className="d-flex justify-content-between">
              <span>Carbohydrates (g)</span>
              <span>{formatAmount(nutrients.carbs)}</span>
            </div>
          </div>

          {!hasValidInputs && (
            <div className="text-danger small mt-2">
              Enter a valid serving size and number of servings to see
              nutrients.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
