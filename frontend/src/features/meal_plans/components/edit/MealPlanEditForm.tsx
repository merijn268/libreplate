import { useState } from "react";
import type {
  MealPlan,
  MealPlanPeriodUnitEnum,
  PatchedMealPlanWritable,
} from "@/api/generated";

import MealPlanEditFields from "./MealPlanEditFields";

type MealPlanEditFormProps = {
  mealPlan: MealPlan;
  onSubmit: (data: PatchedMealPlanWritable) => void;
  onCancel: () => void;
  onDelete: () => void;
  isSaving: boolean;
};

export type MealPlanEditFormState = {
  name: string;
  description: string;
  duration: number;
  duration_period: MealPlanPeriodUnitEnum;
  is_favorite: boolean;
  start_day: number;
};

export default function MealPlanEditForm({
  mealPlan,
  onSubmit,
  onCancel,
  onDelete,
  isSaving,
}: MealPlanEditFormProps) {
  const [formState, setFormState] = useState<MealPlanEditFormState>({
    name: mealPlan.name,
    description: mealPlan.description ?? "",
    duration: mealPlan.duration ?? 1,
    duration_period: mealPlan.duration_period ?? "week",
    is_favorite: mealPlan.is_favorite ?? false,
    start_day: mealPlan.start_day ?? 0,
  });

  function save(state: MealPlanEditFormState) {
    onSubmit({
      name: state.name.trim(),
      description: state.description.trim(),
      duration: state.duration,
      duration_period: state.duration_period,
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
    let nextState = {
      ...formState,
      [field]: value,
    };

    if (field === "duration_period") {
      const nextPeriod = value as MealPlanPeriodUnitEnum;

      if (
        formState.duration_period === "day" &&
        nextPeriod === "week" &&
        formState.duration % 7 === 0
      ) {
        nextState = {
          ...nextState,
          duration: formState.duration / 7,
        };
      } else if (formState.duration_period === "week" && nextPeriod === "day") {
        nextState = {
          ...nextState,
          duration: formState.duration * 7,
        };
      }
    }

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
        onDelete={onDelete}
        isSaving={isSaving}
      />
    </div>
  );
}
