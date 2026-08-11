import { useMemo } from "react";
import type { MealPlan } from "@/api/generated";

import Modal from "@/components/ui/modals/Modal";

type MealPlanDateSelectorModalProps = {
  mealPlan: MealPlan;
  isOpen: boolean;
  selectedDay: number;
  onClose: () => void;
  onSelectDay: (day: number) => void;
};

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function MealPlanDateSelectorModal({
  mealPlan,
  isOpen,
  selectedDay,
  onClose,
  onSelectDay,
}: MealPlanDateSelectorModalProps) {
  const duration = mealPlan.duration ?? 1;

  const durationInDays = useMemo(() => {
    if (mealPlan.duration_period === "week") {
      return duration * 7;
    }

    return duration;
  }, [duration, mealPlan.duration_period]);

  const hasMultipleWeeks = mealPlan.duration_period === "week" && duration > 1;

  const days = useMemo(() => {
    return Array.from({ length: durationInDays }, (_, index) => index + 1);
  }, [durationInDays]);

  return (
    <Modal
      isOpen={isOpen}
      title={
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Select day</h5>

          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={onClose}
          />
        </div>
      }
      onClose={onClose}
    >
      <div className="list-group">
        {days.map((absoluteDay) => {
          const dayInWeek = ((absoluteDay - 1) % 7) + 1;

          const weekNumber = Math.ceil(absoluteDay / 7);

          const startDay = mealPlan.start_day ?? 0;

          const weekdayIndex = (startDay + absoluteDay - 1) % 7;

          const weekday = WEEKDAYS[weekdayIndex];

          const isSelected = absoluteDay === selectedDay;

          const showWeekHeading = hasMultipleWeeks && dayInWeek === 1;

          return (
            <div key={absoluteDay}>
              {showWeekHeading && (
                <div className="px-3 py-2 mt-2 text-body-secondary small fw-semibold">
                  Week {weekNumber}
                </div>
              )}

              <button
                type="button"
                className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${
                  isSelected ? "active" : ""
                }`}
                onClick={() => onSelectDay(absoluteDay)}
              >
                <span>{weekday}</span>

                <span
                  className={isSelected ? "text-white" : "text-body-secondary"}
                >
                  Day {dayInWeek}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
