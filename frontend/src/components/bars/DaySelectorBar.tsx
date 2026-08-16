import React from "react";

type Props = {
  children: React.ReactNode;
  onPrevious: () => void;
  onNext: () => void;
};

export default function SelectorBar({ children, onPrevious, onNext }: Props) {
  return (
    <div
      className="position-relative d-flex align-items-center justify-content-center mb-2 selector-bar"
      style={{ minHeight: "40px" }}
    >
      {/* Previous */}
      <button
        onClick={onPrevious}
        type="button"
        className="btn border-0 bg-transparent shadow-none position-absolute d-flex align-items-center justify-content-center p-0 selector-bar-nav selector-bar-prev"
        style={{
          width: "40px",
          height: "40px",
          zIndex: 2,
        }}
        aria-label="Previous"
      >
        <i className="bi bi-chevron-left" />
      </button>

      {/* Selected item */}
      <div
        className="position-relative flex-shrink-0 d-flex align-items-center gap-2"
        style={{
          zIndex: 1,
        }}
      >
        <i className="bi bi-calendar4" aria-hidden="true" />
        {children}
      </div>

      {/* Next */}
      <button
        onClick={onNext}
        type="button"
        className="btn border-0 bg-transparent shadow-none position-absolute d-flex align-items-center justify-content-center p-0 selector-bar-nav selector-bar-next"
        style={{
          width: "40px",
          height: "40px",
          zIndex: 2,
        }}
        aria-label="Next"
      >
        <i className="bi bi-chevron-right" />
      </button>

      <style>{`
        .selector-bar-nav {
          transition: background-color 0.15s ease;
        }

        .selector-bar-prev {
          left: 0;
        }

        .selector-bar-next {
          right: 0;
        }

        @media (min-width: 768px) {
          .selector-bar-prev {
            left: calc(50% - 160px) !important;
          }

          .selector-bar-next {
            right: calc(50% - 160px) !important;
          }

          .selector-bar-nav:hover {
            background-color: var(--bs-primary) !important;
            color: var(--bs-white) !important;
          }
        }
      `}</style>
    </div>
  );
}
