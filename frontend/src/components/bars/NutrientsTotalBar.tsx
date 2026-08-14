import { useState } from "react";

import TotalsModal from "@/components/modals/NutrientsTotalsModal";

type Props = {
  energy: number;
  protein: number;
  fat: number;
  carbs: number;
};

export default function NutrientTotalsBar({
  energy,
  protein,
  fat,
  carbs,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const totals = {
    energy,
    protein,
    fat,
    carbs,
  };

  return (
    <>
      <div
        className="card mb-2"
        onClick={() => setIsOpen(true)}
        style={{ cursor: "pointer" }}
      >
        <div className="card-body d-flex align-items-center justify-content-between">
          <span>Totals</span>

          <div className="d-flex gap-4 text-muted">
            <span>Kcal {energy.toFixed(0)}</span>
            <span>P {protein.toFixed(0)}</span>
            <span>F {fat.toFixed(0)}</span>
            <span>C {carbs.toFixed(0)}</span>
          </div>
        </div>
      </div>

      <TotalsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Daily Total"
        totals={totals}
      />
    </>
  );
}
