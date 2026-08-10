import type { StartDayEnum } from "@/api/generated";

import type { MealPlanEditFormState } from "./MealPlanEditForm";

type MealPlanEditFieldsProps = {
  formState: MealPlanEditFormState;
  onFieldChange: <K extends keyof MealPlanEditFormState>(
    field: K,
    value: MealPlanEditFormState[K],
  ) => void;
  onFieldBlur: <K extends keyof MealPlanEditFormState>(
    field: K,
    value: MealPlanEditFormState[K],
  ) => void;
  onCancel: () => void;
};

const days = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
] as const;

export default function MealPlanEditFields({
  formState,
  onFieldChange,
  onFieldBlur,
  onCancel,
}: MealPlanEditFieldsProps) {
  return (
    <div className="d-flex flex-column gap-3">
      <div>
        <label htmlFor="meal-plan-name" className="form-label">
          Name
        </label>

        <input
          id="meal-plan-name"
          name="name"
          type="text"
          className="form-control"
          value={formState.name}
          onChange={(event) => onFieldChange("name", event.target.value)}
          onBlur={(event) => onFieldBlur("name", event.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="meal-plan-description" className="form-label">
          Description
        </label>

        <textarea
          id="meal-plan-description"
          name="description"
          className="form-control"
          rows={3}
          value={formState.description}
          onChange={(event) => onFieldChange("description", event.target.value)}
          onBlur={(event) => onFieldBlur("description", event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="meal-plan-duration" className="form-label">
          Duration
        </label>

        <div className="input-group">
          <input
            id="meal-plan-duration"
            name="duration"
            type="number"
            className="form-control"
            min={1}
            value={formState.duration}
            onChange={(event) =>
              onFieldChange("duration", Number(event.target.value))
            }
            onBlur={(event) =>
              onFieldBlur("duration", Number(event.target.value))
            }
            required
          />

          <span className="input-group-text">days</span>
        </div>
      </div>

      <div>
        <label htmlFor="meal-plan-start-day" className="form-label">
          Start day
        </label>

        <select
          id="meal-plan-start-day"
          name="start_day"
          className="form-select"
          value={formState.start_day}
          onChange={(event) => {
            const value = Number(event.target.value);

            if (value >= 0 && value <= 6) {
              onFieldBlur("start_day", value as StartDayEnum);
            }
          }}
        >
          {days.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-check">
        <input
          id="meal-plan-favorite"
          name="is_favorite"
          type="checkbox"
          className="form-check-input"
          checked={formState.is_favorite}
          onChange={(event) => onFieldBlur("is_favorite", event.target.checked)}
        />

        <label htmlFor="meal-plan-favorite" className="form-check-label">
          Favorite
        </label>
      </div>

      <div className="mt-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Back
        </button>
      </div>
    </div>
  );
}
