import { useRef } from "react";
import SelectorBar from "./bars/SelectorBar";

type Props = {
  selectedDate: string;
  todayString: string;
  onChangeDate: (date: string) => void;
  onPrevious: () => void;
  onNext: () => void;
};

export default function DaySelector({
  selectedDate,
  todayString,
  onChangeDate,
  onPrevious,
  onNext,
}: Props) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === "function") {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.click();
      }
    }
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChangeDate(event.target.value);
  };

  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function formatDisplayDate(): string {
    const selected = new Date(`${selectedDate}T00:00:00`);
    const today = new Date(`${todayString}T00:00:00`);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const datePart = selected.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });

    if (selectedDate === formatDate(yesterday)) {
      return `Yesterday, ${datePart}`;
    }

    if (selectedDate === todayString) {
      return `Today, ${datePart}`;
    }

    if (selectedDate === formatDate(tomorrow)) {
      return `Tomorrow, ${datePart}`;
    }

    return selected.toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
  }

  return (
    <SelectorBar onPrevious={onPrevious} onNext={onNext}>
      <input
        ref={dateInputRef}
        type="date"
        value={selectedDate}
        onChange={handleDateChange}
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          zIndex: -1,
        }}
        tabIndex={-1}
      />

      <button
        onClick={handleButtonClick}
        type="button"
        className="btn border-0 bg-transparent shadow-none d-flex align-items-center justify-content-center p-0 text-body"
        style={{
          height: "40px",
          minWidth: "120px",
          borderRadius: "0.375rem",
        }}
        aria-label="Select date"
      >
        <span>{formatDisplayDate()}</span>
      </button>
    </SelectorBar>
  );
}
