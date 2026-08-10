import type { DayMeal } from "@/api/generated";

import MealCardController from "@/features/diary/components/MealCardController";

type Props = {
  meals: DayMeal[];
  onAdd: (meal: DayMeal) => void;
  onDiaryChanged: () => Promise<void>;
};

export default function MealList({ meals, onAdd, onDiaryChanged }: Props) {
  return (
    <div>
      {meals.map((meal) => (
        <MealCardController
          key={meal.default_meal.id}
          meal={meal}
          onAdd={onAdd}
          onDiaryChanged={onDiaryChanged}
        />
      ))}
    </div>
  );
}
