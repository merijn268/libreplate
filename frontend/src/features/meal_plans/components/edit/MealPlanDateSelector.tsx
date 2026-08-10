import { useState } from "react";
import SelectorBar from "@/components/ui/bars/SelectorBar";

export default function MealPlanDateSelector() {
  const [selectedDay, setSelectedDay] = useState(1);

  const handlePrevious = () => {
    setSelectedDay((day) => Math.max(1, day - 1));
  };

  const handleNext = () => {
    setSelectedDay((day) => day + 1);
  };

  return (
    <SelectorBar onPrevious={handlePrevious} onNext={handleNext}>
      <button
        type="button"
        className="btn border-0 bg-transparent shadow-none d-flex align-items-center justify-content-center text-body"
        style={{
          height: "40px",
          minWidth: "120px",
          borderRadius: "0.375rem",
        }}
        onClick={() => console.log(`Day ${selectedDay} selected`)}
      >
        Day {selectedDay}
      </button>
    </SelectorBar>
  );
}
