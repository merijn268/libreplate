import type { ReactNode } from "react";

import Modal from "@/components/modals/Modal";
import MacroPieChart from "@/components/MacroPieChart";

type Totals = {
  energy: number;
  protein: number;
  fat: number;
  carbs: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  totals: Totals;
};

export default function TotalsModal({ isOpen, onClose, title, totals }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-body">
        <MacroPieChart
          protein={totals.protein}
          fat={totals.fat}
          carbs={totals.carbs}
        />

        <div className="border rounded p-3">
          <div className="fw-semibold mb-2">Nutrients</div>

          <div>
            <div className="d-flex justify-content-between py-2">
              <span>Energy</span>
              <span>{totals.energy.toFixed(0)} kcal</span>
            </div>

            <div className="d-flex justify-content-between py-2">
              <span>Protein</span>
              <span>{totals.protein.toFixed(0)} g</span>
            </div>

            <div className="d-flex justify-content-between py-2">
              <span>Fat</span>
              <span>{totals.fat.toFixed(0)} g</span>
            </div>

            <div className="d-flex justify-content-between py-2">
              <span>Carbohydrates</span>
              <span>{totals.carbs.toFixed(0)} g</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
