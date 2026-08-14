import { useMemo, useState } from "react";

import type { Food } from "@/api/generated";
import Modal from "@/components/ui/modals/Modal";
import MacroPieChart from "@/components/ui/MacroPieChart";

type Props = {
  food: Food;
  servingSize: number;
  numberOfServings: number;
  onClose: () => void;
  onSave: (values: {
    serving_size: number;
    number_of_servings: number;
  }) => Promise<void>;
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

export default function EditFoodAmountModal({
  food,
  servingSize,
  numberOfServings,
  onClose,
  onSave,
}: Props) {
  const [currentServingSize, setCurrentServingSize] = useState(
    String(servingSize),
  );

  const [currentNumberOfServings, setCurrentNumberOfServings] = useState(
    String(numberOfServings),
  );

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
    });

    onClose();
  }

  return (
    <Modal
      isOpen
      title={food.name}
      onClose={onClose}
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void handleSave()}
            disabled={!hasValidInputs}
          >
            Save
          </button>
        </div>
      }
    >
      <div className="d-flex flex-column gap-3">
        <div className="d-flex gap-3">
          <div className="w-50">
            <label className="form-label">Serving size (g)</label>

            <input
              type="number"
              min={0}
              step="any"
              className="form-control"
              value={currentServingSize}
              onChange={(event) => setCurrentServingSize(event.target.value)}
            />
          </div>

          <div className="w-50">
            <label className="form-label">Number of servings</label>

            <input
              type="number"
              min={0}
              step="any"
              className="form-control"
              value={currentNumberOfServings}
              onChange={(event) =>
                setCurrentNumberOfServings(event.target.value)
              }
            />
          </div>
        </div>

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
