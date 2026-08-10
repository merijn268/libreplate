import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import {
  mealsMealFoodsDestroy,
  mealsMealFoodsPartialUpdate,
} from "@/api/generated";

import type { DayMeal } from "@/api/generated";

import TotalsModal from "@/components/ui/modals/NutrientsTotalsModal";
import MealCard from "@/components/ui/meal_card/MealCard";
import FoodAmountItem from "@/features/diary/components/FoodAmountItem";

import { computeMealTotals } from "@/features/diary/utils/MealFormulas";

type Props = {
  meal: DayMeal;
  onAdd: (meal: DayMeal) => void;
  onDiaryChanged: () => Promise<void>;
};

export default function MealCardController({
  meal,
  onAdd,
  onDiaryChanged,
}: Props) {
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

  async function handleSaveFood(values: {
    id: number;
    serving_size: number;
    number_of_servings: number;
  }) {
    await updateMealFood.mutateAsync(values);
    await onDiaryChanged();
  }

  async function handleDeleteFood(id: number) {
    await deleteMealFood.mutateAsync(id);
    await onDiaryChanged();
  }

  return (
    <>
      <TotalsModal
        isOpen={isTotalsModalOpen}
        onClose={() => setIsTotalsModalOpen(false)}
        title={meal.name}
        totals={totals}
      />

      <MealCard
        name={meal.name}
        open={open}
        totals={totals}
        onToggle={() => setOpen((current) => !current)}
        onShowTotals={() => setIsTotalsModalOpen(true)}
        onAdd={() => onAdd(meal)}
      >
        {mealFoods.length > 0 && (
          <ul className="list-group list-group-flush">
            {mealFoods.map((item) => (
              <FoodAmountItem
                key={item.id}
                item={item}
                onSave={handleSaveFood}
                onDelete={handleDeleteFood}
              />
            ))}
          </ul>
        )}
      </MealCard>
    </>
  );
}
