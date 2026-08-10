import MealPlanDateSelector from "./MealPlanDateSelector";
import NutrientTotalsBar from "@/components/ui/bars/NutrientsTotalBar";

export default function MealPlanEditContent() {
  return (
    <div className="container">
      <MealPlanDateSelector />
      <NutrientTotalsBar energy={13} protein={14} fat={15} carbs={16} />
    </div>
  );
}
