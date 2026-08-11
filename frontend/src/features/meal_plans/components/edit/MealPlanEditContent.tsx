import type { MealPlan } from "@/api/generated";

import MealPlanDateSelector from "./MealPlanDateSelector";
import NutrientTotalsBar from "@/components/ui/bars/NutrientsTotalBar";

type MealPlanEditContentProps = {
  mealPlan: MealPlan;
};

export default function MealPlanEditContent({
  mealPlan,
}: MealPlanEditContentProps) {
  return (
    <div className="container">
      <MealPlanDateSelector mealPlan={mealPlan} />
      <NutrientTotalsBar energy={13} protein={14} fat={15} carbs={16} />
    </div>
  );
}
