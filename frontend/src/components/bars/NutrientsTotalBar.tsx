import { useState } from "react";

import TotalsModal from "@/components/modals/NutrientsTotalsModal";

type Props = {
  energy: number;
  protein: number;
  fat: number;
  carbs: number;
  energyGoal?: number;
  proteinGoal?: number;
  fatGoal?: number;
  carbsGoal?: number;
};

export default function NutrientTotalsBar({
  energy,
  protein,
  fat,
  carbs,
  energyGoal,
  proteinGoal,
  fatGoal,
  carbsGoal,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="card mb-2 app-surface w-100 text-start p-0"
        onClick={() => setIsOpen(true)}
      >
        <div className="card-body px-3 py-2">
          <div className="d-flex align-items-center">
            <div className="flex-grow-1">
              <div className="d-flex align-items-baseline gap-3">
                <Energy value={energy} goal={energyGoal} />

                <Macro label="Protein" value={protein} goal={proteinGoal} />

                <Macro label="Fats" value={fat} goal={fatGoal} />

                <Macro label="Carbs" value={carbs} goal={carbsGoal} />
              </div>
            </div>
          </div>
        </div>
      </button>

      <TotalsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Daily Total"
        totals={{
          energy,
          protein,
          fat,
          carbs,
        }}
      />
    </>
  );
}

function Energy({ value, goal }: { value: number; goal?: number }) {
  const hasGoal = goal !== undefined && goal > 0;
  const isOverGoal = hasGoal && value > goal;

  return (
    <div className="lh-sm flex-shrink-0">
      <div className="text-body-secondary small">kcal</div>

      <div className={isOverGoal ? "text-danger fw-semibold" : "fw-semibold"}>
        {value.toFixed(0)}

        {hasGoal && (
          <span className="text-body-secondary fw-normal">
            {" "}
            / {goal.toFixed(0)}
          </span>
        )}
      </div>
    </div>
  );
}

function Macro({
  label,
  value,
  goal,
}: {
  label: string;
  value: number;
  goal?: number;
}) {
  const hasGoal = goal !== undefined && goal > 0;
  const isOverGoal = hasGoal && value > goal;

  const percentage = hasGoal ? Math.min((value / goal) * 100, 100) : 0;

  return (
    <div className="lh-sm flex-grow-1">
      <div className="text-body-secondary small">{label}</div>

      <div className={isOverGoal ? "text-danger fw-semibold" : "fw-semibold"}>
        {value.toFixed(0)}

        {hasGoal && (
          <span className="text-body-secondary fw-normal">
            {" "}
            / {goal.toFixed(0)}
          </span>
        )}
      </div>

      {hasGoal && (
        <div
          className="progress bg-body-tertiary mt-1"
          style={{ height: 3 }}
          aria-hidden="true"
        >
          <div
            className={`progress-bar ${
              isOverGoal ? "bg-danger" : "bg-primary"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
