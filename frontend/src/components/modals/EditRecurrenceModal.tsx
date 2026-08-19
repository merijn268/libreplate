import { useState } from "react";

import type {
  EndEnum,
  MealPlanPeriodUnitEnum,
  PlannedMealEntryRecurrence,
} from "@/api/generated";
import Modal from "@/components/modals/Modal";

type Props = {
  isOpen: boolean;
  recurrence?: PlannedMealEntryRecurrence;
  onClose: () => void;
  onSave: (recurrence: PlannedMealEntryRecurrence | undefined) => void;
};

type RecurrenceEnd = "never" | "on_day" | "after";
type RecurrenceInterval = "day" | "week";

const WEEKDAYS = [
  { value: 0, label: "Mon" },
  { value: 1, label: "Tue" },
  { value: 2, label: "Wed" },
  { value: 3, label: "Thu" },
  { value: 4, label: "Fri" },
  { value: 5, label: "Sat" },
  { value: 6, label: "Sun" },
];

function getWeekdays(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (day): day is number =>
      typeof day === "number" && Number.isInteger(day) && day >= 0 && day <= 6,
  );
}

export default function EditRecurrenceModal({
  isOpen,
  recurrence,
  onClose,
  onSave,
}: Props) {
  const [interval, setInterval] = useState<RecurrenceInterval>(
    (recurrence?.interval as RecurrenceInterval) ?? "week",
  );

  const [intervalCount, setIntervalCount] = useState(
    String(recurrence?.interval_count ?? 1),
  );

  const [weekdays, setWeekdays] = useState<number[]>(
    getWeekdays(recurrence?.weekdays),
  );

  const [end, setEnd] = useState<RecurrenceEnd>(
    (recurrence?.end as RecurrenceEnd) ?? "never",
  );

  const [endDay, setEndDay] = useState(
    recurrence?.end_day != null ? String(recurrence.end_day) : "",
  );

  const [endAfter, setEndAfter] = useState(
    recurrence?.end_after != null ? String(recurrence.end_after) : "",
  );

  // Re-seed the form fields whenever the modal transitions to open, or
  // whenever the `recurrence` prop changes while it's already open.
  // Tracked with plain state + a render-time check instead of an effect.
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevRecurrence, setPrevRecurrence] = useState(recurrence);

  const shouldReseed =
    isOpen && (isOpen !== prevIsOpen || recurrence !== prevRecurrence);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
  }

  if (shouldReseed) {
    setPrevRecurrence(recurrence);

    setInterval((recurrence?.interval as RecurrenceInterval) ?? "week");
    setIntervalCount(String(recurrence?.interval_count ?? 1));
    setWeekdays(getWeekdays(recurrence?.weekdays));
    setEnd((recurrence?.end as RecurrenceEnd) ?? "never");
    setEndDay(recurrence?.end_day != null ? String(recurrence.end_day) : "");
    setEndAfter(
      recurrence?.end_after != null ? String(recurrence.end_after) : "",
    );
  }

  const parsedIntervalCount = Number.parseInt(intervalCount, 10);
  const parsedEndDay = Number.parseInt(endDay, 10);
  const parsedEndAfter = Number.parseInt(endAfter, 10);

  const hasValidInterval =
    Number.isInteger(parsedIntervalCount) && parsedIntervalCount > 0;

  const hasValidEndDay =
    end !== "on_day" || (Number.isInteger(parsedEndDay) && parsedEndDay >= 0);

  const hasValidEndAfter =
    end !== "after" || (Number.isInteger(parsedEndAfter) && parsedEndAfter > 0);

  const hasValidWeekdays = interval !== "week" || weekdays.length > 0;

  const isValid =
    hasValidInterval && hasValidEndDay && hasValidEndAfter && hasValidWeekdays;

  function toggleWeekday(day: number) {
    setWeekdays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  }

  function handleSave() {
    if (!isValid) {
      return;
    }

    const nextRecurrence: PlannedMealEntryRecurrence = {
      interval_count: parsedIntervalCount,
      interval: interval as MealPlanPeriodUnitEnum,
      weekdays: interval === "week" ? weekdays : undefined,
      end: end as EndEnum,
      end_day: end === "on_day" ? parsedEndDay : null,
      end_after: end === "after" ? parsedEndAfter : null,
    };

    onSave(nextRecurrence);
  }

  function handleDisableRecurrence() {
    onSave(undefined);
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Edit recurrence"
      onClose={onClose}
      footer={
        <div className="d-flex justify-content-between">
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={handleDisableRecurrence}
          >
            No recurrence
          </button>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-primary"
              disabled={!isValid}
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      }
    >
      <div className="d-flex flex-column gap-3">
        <div className="d-flex gap-3">
          <div className="w-50">
            <label className="form-label">Repeat every</label>

            <input
              type="number"
              min={1}
              step={1}
              className="form-control"
              value={intervalCount}
              onChange={(event) => setIntervalCount(event.target.value)}
            />
          </div>

          <div className="w-50">
            <label className="form-label">Interval</label>

            <select
              className="form-select"
              value={interval}
              onChange={(event) =>
                setInterval(event.target.value as RecurrenceInterval)
              }
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
            </select>
          </div>
        </div>

        {interval === "week" && (
          <div>
            <label className="form-label">Repeat on</label>

            <div className="d-flex flex-wrap gap-2">
              {WEEKDAYS.map((weekday) => (
                <label
                  key={weekday.value}
                  className="border rounded px-2 py-1 d-flex align-items-center gap-1"
                >
                  <input
                    type="checkbox"
                    checked={weekdays.includes(weekday.value)}
                    onChange={() => toggleWeekday(weekday.value)}
                  />

                  <span>{weekday.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="form-label">Ends</label>

          <select
            className="form-select"
            value={end}
            onChange={(event) => setEnd(event.target.value as RecurrenceEnd)}
          >
            <option value="never">Never</option>
            <option value="on_day">On day</option>
            <option value="after">After occurrences</option>
          </select>
        </div>

        {end === "on_day" && (
          <div>
            <label className="form-label">End day</label>

            <input
              type="number"
              min={0}
              step={1}
              className="form-control"
              value={endDay}
              onChange={(event) => setEndDay(event.target.value)}
            />
          </div>
        )}

        {end === "after" && (
          <div>
            <label className="form-label">Occurrences</label>

            <input
              type="number"
              min={1}
              step={1}
              className="form-control"
              value={endAfter}
              onChange={(event) => setEndAfter(event.target.value)}
            />
          </div>
        )}

        {!isValid && (
          <div className="text-danger small">
            Enter valid recurrence values.
            {interval === "week" && weekdays.length === 0
              ? " Select at least one weekday."
              : ""}
          </div>
        )}
      </div>
    </Modal>
  );
}
