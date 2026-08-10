import { useState } from "react";
import type {
  MealPlan,
  PatchedMealPlanWritable,
  StartDayEnum,
} from "@/api/generated";

import MealPlanEditFields from "./MealPlanEditFields";

type MealPlanEditFormProps = {
  mealPlan: MealPlan;
  onSubmit: (data: PatchedMealPlanWritable) => void;
  onCancel: () => void;
  isSaving: boolean;
};

export type MealPlanEditFormState = {
  name: string;
  description: string;
  duration: number;
  is_favorite: boolean;
  start_day: StartDayEnum;
};

export default function MealPlanEditForm({
  mealPlan,
  onSubmit,
  onCancel,
}: MealPlanEditFormProps) {
  const [formState, setFormState] = useState<MealPlanEditFormState>({
    name: mealPlan.name,
    description: mealPlan.description ?? "",
    duration: mealPlan.duration ?? 1,
    is_favorite: mealPlan.is_favorite ?? false,
    start_day: mealPlan.start_day ?? 0,
  });

  function save(state: MealPlanEditFormState) {
    onSubmit({
      name: state.name.trim(),
      description: state.description.trim(),
      duration: state.duration,
      is_favorite: state.is_favorite,
      start_day: state.start_day,
    });
  }

  function updateField<K extends keyof MealPlanEditFormState>(
    field: K,
    value: MealPlanEditFormState[K],
  ) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateAndSave<K extends keyof MealPlanEditFormState>(
    field: K,
    value: MealPlanEditFormState[K],
  ) {
    const nextState = {
      ...formState,
      [field]: value,
    };

    setFormState(nextState);
    save(nextState);
  }

  return (
    <div className="container py-4">
      <MealPlanEditFields
        formState={formState}
        onFieldChange={updateField}
        onFieldBlur={updateAndSave}
        onCancel={onCancel}
      />
    </div>
  );
}
