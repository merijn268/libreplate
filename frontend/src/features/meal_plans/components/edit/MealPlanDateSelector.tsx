import { useEffect, useState } from "react";
import SelectorBar from "@/components/ui/bars/SelectorBar";
import type { MealPlan } from "@/api/generated";

import MealPlanDateSelectorModal from "./MealPlanDateSelectorModal";

type MealPlanDateSelectorProps = {
  mealPlan: MealPlan;
  onDateChange?: (day: number, weekday: string) => void;
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

export default function MealPlanDateSelector({
  mealPlan,
  onDateChange,
}: MealPlanDateSelectorProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const duration = mealPlan.duration ?? 1;

  const durationInDays =
    mealPlan.duration_period === "week" ? duration * 7 : duration;

  const hasMultipleWeeks = mealPlan.duration_period === "week" && duration > 1;

  const getWeekday = (day: number) => {
    const startDay = mealPlan.start_day ?? 0;
    const weekdayIndex = (startDay + day) % 7;

    return WEEKDAYS[weekdayIndex] ?? "";
  };

  const weekday = getWeekday(selectedDay);

  useEffect(() => {
    setSelectedDay((currentDay) => {
      const nextDay = Math.min(
        Math.max(currentDay, 0),
        Math.max(durationInDays - 1, 0),
      );

      return currentDay === nextDay ? currentDay : nextDay;
    });
  }, [durationInDays]);

  const notifyDateChange = (day: number) => {
    onDateChange?.(day, getWeekday(day));
  };

  const handlePrevious = () => {
    setSelectedDay((currentDay) => {
      const nextDay = Math.max(0, currentDay - 1);

      if (nextDay !== currentDay) {
        notifyDateChange(nextDay);
      }

      return nextDay;
    });
  };

  const handleNext = () => {
    setSelectedDay((currentDay) => {
      const nextDay = Math.min(durationInDays - 1, currentDay + 1);

      if (nextDay !== currentDay) {
        notifyDateChange(nextDay);
      }

      return nextDay;
    });
  };

  const handleSelectDay = (day: number) => {
    const clampedDay = Math.min(
      Math.max(day, 0),
      Math.max(durationInDays - 1, 0),
    );

    setSelectedDay((currentDay) => {
      if (currentDay !== clampedDay) {
        notifyDateChange(clampedDay);
      }

      return clampedDay;
    });

    setIsModalOpen(false);
  };

  const displayDay = hasMultipleWeeks ? (selectedDay % 7) + 1 : selectedDay + 1;

  const weekNumber = hasMultipleWeeks ? Math.floor(selectedDay / 7) + 1 : null;

  return (
    <>
      <SelectorBar onPrevious={handlePrevious} onNext={handleNext}>
        <button
          type="button"
          className="btn border-0 bg-transparent shadow-none d-flex align-items-center justify-content-center text-body"
          style={{
            height: "40px",
            minWidth: "160px",
            borderRadius: "0.375rem",
          }}
          onClick={() => setIsModalOpen(true)}
        >
          {weekday}, Day {displayDay}
          {weekNumber !== null && `, Week ${weekNumber}`}
        </button>
      </SelectorBar>

      <MealPlanDateSelectorModal
        mealPlan={mealPlan}
        isOpen={isModalOpen}
        selectedDay={selectedDay}
        onClose={() => setIsModalOpen(false)}
        onSelectDay={handleSelectDay}
      />
    </>
  );
}
