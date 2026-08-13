import { useEffect, useMemo, useState } from "react";
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

  const durationInDays = useMemo(() => {
    if (mealPlan.duration_period === "week") {
      return duration * 7;
    }

    return duration;
  }, [duration, mealPlan.duration_period]);

  const hasMultipleWeeks = mealPlan.duration_period === "week" && duration > 1;

  const weekday = useMemo(() => {
    const startDay = mealPlan.start_day ?? 0;
    const weekdayIndex = (startDay + selectedDay) % 7;

    return WEEKDAYS[weekdayIndex] ?? "";
  }, [mealPlan.start_day, selectedDay]);

  useEffect(() => {
    setSelectedDay((day) => Math.min(day, durationInDays - 1));
  }, [durationInDays]);

  useEffect(() => {
    onDateChange?.(selectedDay, weekday);
  }, [selectedDay, weekday, onDateChange]);

  // Convert the zero-based API value to a human-friendly number.
  const displayDay = hasMultipleWeeks ? (selectedDay % 7) + 1 : selectedDay + 1;

  const weekNumber = hasMultipleWeeks ? Math.floor(selectedDay / 7) + 1 : null;

  const handlePrevious = () => {
    setSelectedDay((day) => Math.max(0, day - 1));
  };

  const handleNext = () => {
    setSelectedDay((day) => Math.min(durationInDays - 1, day + 1));
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    setIsModalOpen(false);
  };

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
