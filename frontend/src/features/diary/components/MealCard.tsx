import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import {
  mealsMealFoodsDestroy,
  mealsMealFoodsPartialUpdate,
} from "@/api/generated";

import TotalsModal from "@/components/ui/NutrientsTotalsModal";
import FoodItem from "@/components/ui/FoodAmountItem";

import type { DayMeal } from "@/api/generated";

import { computeMealTotals } from "@/features/diary/utils/MealFormulas";

type Props = {
  meal: DayMeal;
  onAdd: (meal: DayMeal) => void;
  onDiaryChanged: () => Promise<void>;
};

export default function MealCard({ meal, onAdd, onDiaryChanged }: Props) {
  const [open, setOpen] = useState(true);
  const [isTotalsModalOpen, setIsTotalsModalOpen] = useState(false);

  const mealFoods = meal.meal_foods ?? [];
  const totals = computeMealTotals(mealFoods);

  const deleteMealFood = useMutation({
    mutationFn: async (id: number) => {
      await mealsMealFoodsDestroy({
        path: {
          id,
        },
      });
    },
  });

  const updateMealFood = useMutation({
    mutationFn: async ({
      id,
      serving_size,
      number_of_servings,
    }: {
      id: number;
      serving_size: number;
      number_of_servings: number;
    }) => {
      const response = await mealsMealFoodsPartialUpdate({
        path: {
          id,
        },
        body: {
          serving_size,
          number_of_servings,
        },
      });

      return response.data;
    },
  });

  return (
    <div className="col-12">
      <div className="card">
        <div className="card-body px-3 py-3">
          <TotalsModal
            isOpen={isTotalsModalOpen}
            onClose={() => setIsTotalsModalOpen(false)}
            title={meal.name}
            totals={totals}
          />

          <div className="d-flex justify-content-between align-items-start mb-1">
            <div className="d-flex align-items-center gap-2 flex-grow-1">
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setOpen((current) => !current)}
              >
                <i
                  className={`bi ${
                    open ? "bi-chevron-down" : "bi-chevron-right"
                  }`}
                />
              </button>

              <div
                className="flex-grow-1"
                onClick={() => setIsTotalsModalOpen(true)}
                style={{ cursor: "pointer" }}
              >
                <h2 className="h5 m-0">{meal.name}</h2>

                <div className="small text-muted d-flex gap-3">
                  <span>Kcal {totals.energy.toFixed(0)}</span>
                  <span>P {totals.protein.toFixed(0)}</span>
                  <span>F {totals.fat.toFixed(0)}</span>
                  <span>C {totals.carbs.toFixed(0)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => onAdd(meal)}
              aria-label="Add to meal"
            >
              <i className="bi bi-plus-lg" />
            </button>
          </div>

          <div className={`collapse ${open ? "show" : ""}`}>
            {mealFoods.length > 0 && (
              <ul className="list-group list-group-flush">
                {mealFoods.map((item) => (
                  <FoodItem
                    key={item.id}
                    item={item}
                    onSave={async (values) => {
                      await updateMealFood.mutateAsync(values);
                      await onDiaryChanged();
                    }}
                    onDelete={async (id) => {
                      await deleteMealFood.mutateAsync(id);
                      await onDiaryChanged();
                    }}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
