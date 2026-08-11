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

  // Updates local form state only, with no save. Used for fields that
  // change on every keystroke (text inputs, the duration number field) so
  // typing feels instant and doesn't trigger a request - and the re-render
  // that comes with it - on every character.
  function updateField<K extends keyof MealPlanEditFormState>(
    field: K,
    value: MealPlanEditFormState[K],
  ) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // Updates local state AND persists it. Used when a field is "committed"
  // by the user - on blur for text/number fields, or immediately for
  // discrete controls (selects, checkboxes) where every change is already
  // a deliberate, complete choice rather than a keystroke.
  function updateAndSave<K extends keyof MealPlanEditFormState>(
    field: K,
    value: MealPlanEditFormState[K],
  ) {
    const nextState: MealPlanEditFormState = {
      ...formState,
      [field]: value,
    };

    if (field === "duration_period") {
      const nextPeriod = value as MealPlanPeriodUnitEnum;

      if (formState.duration_period === "week" && nextPeriod === "day") {
        nextState.duration = formState.duration * 7;
      } else if (formState.duration_period === "day" && nextPeriod === "week") {
        nextState.duration = Math.ceil(formState.duration / 7);
      }
    }

    setFormState(nextState);
    save(nextState);
  }

  return (
    <div className="container">
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
