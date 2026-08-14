import { useCallback, useMemo, useState } from "react";
import type { MealPlan } from "@/api/generated";

import MealPlanDateSelector from "./MealPlanDateSelector";
import PlannedMealsList from "./PlannedMealsList";
import NutrientTotalsBar from "@/components/bars/NutrientsTotalBar";
import { getDayNutrients } from "../utils/mealPlanNutrients";

type MealPlanEditContentProps = {
  mealPlan: MealPlan;
};

export default function MealPlanEditContent({
  mealPlan,
}: MealPlanEditContentProps) {
  const [selectedDate, setSelectedDate] = useState<{
    day: number;
    weekday: string;
  }>({
    day: 0,
    weekday: "",
  });

  /*
   * Keep the callback identity stable.
   *
   * Without useCallback, MealPlanDateSelector receives a new
   * onDateChange function on every render. Its effect would then
   * run again, update this state, cause another render, create
   * another callback, and repeat indefinitely.
   */
  const handleDateChange = useCallback((day: number, weekday: string) => {
    setSelectedDate((current) => {
      if (current.day === day && current.weekday === weekday) {
        return current;
      }

      return { day, weekday };
    });
  }, []);

  const dayNutrients = useMemo(
    () => getDayNutrients(mealPlan, selectedDate.day),
    [mealPlan, selectedDate.day],
  );

  const getNutrientAmount = (name: string) =>
    dayNutrients.find(
      (nutrient) => nutrient.name.toLowerCase() === name.toLowerCase(),
    )?.amount ?? 0;

  return (
    <div>
      <MealPlanDateSelector
        mealPlan={mealPlan}
        onDateChange={handleDateChange}
      />

      <NutrientTotalsBar
        energy={getNutrientAmount("energy")}
        protein={getNutrientAmount("protein")}
        fat={getNutrientAmount("fat")}
        carbs={getNutrientAmount("carbohydrates")}
      />

      <PlannedMealsList mealPlan={mealPlan} day={selectedDate.day} />
    </div>
  );
}
