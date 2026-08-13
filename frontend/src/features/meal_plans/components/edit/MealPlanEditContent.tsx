import { useMemo, useState } from "react";
import type { MealPlan } from "@/api/generated";

import MealPlanDateSelector from "./MealPlanDateSelector";
import PlannedMealsList from "./PlannedMealsList";
import NutrientTotalsBar from "@/components/ui/bars/NutrientsTotalBar";
import { getDayNutrients } from "./../mealPlanNutrients";

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

  const handleDateChange = (day: number, weekday: string) => {
    setSelectedDate({ day, weekday });
  };

  const dayNutrients = useMemo(
    () => getDayNutrients(mealPlan, selectedDate.day),
    [mealPlan, selectedDate.day],
  );

  const getNutrientAmount = (name: string) =>
    dayNutrients.find(
      (nutrient) => nutrient.name.toLowerCase() === name.toLowerCase(),
    )?.amount ?? 0;

  return (
    <div className="container">
      <MealPlanDateSelector
        mealPlan={mealPlan}
        onDateChange={handleDateChange}
      />

      <NutrientTotalsBar
        energy={getNutrientAmount("energy")}
        protein={getNutrientAmount("protein")}
        fat={getNutrientAmount("fat")}
        carbs={getNutrientAmount("carbs")}
      />

      <PlannedMealsList mealPlan={mealPlan} day={selectedDate.day} />
    </div>
  );
}
