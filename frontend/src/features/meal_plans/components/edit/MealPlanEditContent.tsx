import MealPlanDateSelector from "./MealPlanDateSelector";
import NutrientTotalsBar from "@/components/ui/bars/NutrientsTotalBar";

export default function MealPlanEditContent() {
  return (
    <div>
      <MealPlanDateSelector />

      <NutrientTotalsBar energy={0} protein={0} fat={0} carbs={0} />
    </div>
  );
}
