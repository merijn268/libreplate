import { useRef } from "react";

type Props = {
  selectedDate: string;
  todayString: string;
  onChangeDate: (date: string) => void;
  onPrevious: () => void;
  onNext: () => void;
};

export default function DiaryHeader({
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
    <div
      className="position-relative d-flex align-items-center justify-content-center mb-2 diary-header"
      style={{ minHeight: "40px" }}
    >
      {/* Previous */}
      <button
        onClick={onPrevious}
        type="button"
        className="btn border-0 bg-transparent shadow-none position-absolute d-flex align-items-center justify-content-center p-0 text-secondary diary-header-nav diary-header-prev"
        style={{
          width: "40px",
          height: "40px",
          zIndex: 2,
        }}
        aria-label="Previous day"
      >
        <i className="bi bi-chevron-left" />
      </button>

      {/* Date */}
      <div
        className="position-relative flex-shrink-0"
        style={{
          zIndex: 1,
        }}
      >
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
          className="btn border-0 bg-transparent shadow-none d-flex align-items-center justify-content-center p-0 text-body diary-header-date-button"
          style={{
            height: "40px",
          }}
          aria-label="Select date"
        >
          <span>{formatDisplayDate()}</span>
        </button>
      </div>

      {/* Next */}
      <button
        onClick={onNext}
        type="button"
        className="btn border-0 bg-transparent shadow-none position-absolute d-flex align-items-center justify-content-center p-0 text-secondary diary-header-nav diary-header-next"
        style={{
          width: "40px",
          height: "40px",
          zIndex: 2,
        }}
        aria-label="Next day"
      >
        <i className="bi bi-chevron-right" />
      </button>

      <style>{`
        .diary-header-nav,
        .diary-header-date-button {
          transition: background-color 0.15s ease;
        }

        /* Mobile */
        .diary-header-prev {
          left: 0;
        }

        .diary-header-next {
          right: 0;
        }

        .diary-header-date-button {
          min-width: 120px;
          border-radius: 0.375rem;
        }

        /* Desktop */
        @media (min-width: 768px) {
          .diary-header-prev {
            left: calc(50% - 160px) !important;
          }

          .diary-header-next {
            right: calc(50% - 160px) !important;
          }

          .diary-header-date-button {
            width: 230px;
          }

          .diary-header-nav:hover,
          .diary-header-date-button:hover {
            background-color: var(--bs-secondary) !important;
            color: var(--bs-white) !important;
          }
        }
      `}</style>
    </div>
  );
}
