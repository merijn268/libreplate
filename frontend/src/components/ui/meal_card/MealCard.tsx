import type { ReactNode } from "react";

type Props = {
  /** Display name shown in the meal card header. */
  name: string;

  /** Whether the meal's contents are currently expanded. */
  open: boolean;

  /** Nutritional totals displayed beneath the meal name. */
  totals: {
    energy: number;
    protein: number;
    fat: number;
    carbs: number;
  };

  /** Called when the user expands or collapses the meal. */
  onToggle: () => void;

  /** Called when the user clicks the meal header to view its totals. */
  onShowTotals: () => void;

  /** Called when the user clicks the add button. */
  onAdd: () => void;

  /** Content rendered below the meal header when the card is expanded. */
  children?: ReactNode;
};

export default function MealCard({
  name,
  open,
  totals,
  onToggle,
  onShowTotals,
  onAdd,
  children,
}: Props) {
  return (
    <div className="mb-2">
      <div className="card">
        <div className="card-body">
          <div className="d-flex align-items-center">
            <button
              type="button"
              className="btn btn-sm"
              onClick={onToggle}
              aria-label={open ? "Collapse meal" : "Expand meal"}
            >
              <i
                className={`bi ${
                  open ? "bi-chevron-down" : "bi-chevron-right"
                }`}
              />
            </button>

            <div
              className="flex-grow-1"
              onClick={onShowTotals}
              style={{ cursor: "pointer" }}
            >
              <h2 className="h5 m-0">{name}</h2>

              <div className="small text-muted d-flex gap-3">
                <span>Kcal {totals.energy.toFixed(0)}</span>
                <span>P {totals.protein.toFixed(0)}</span>
                <span>F {totals.fat.toFixed(0)}</span>
                <span>C {totals.carbs.toFixed(0)}</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={onAdd}
              aria-label="Add to meal"
            >
              <i className="bi bi-plus-lg" />
            </button>
          </div>

          <div className={`collapse ${open ? "show" : ""}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
