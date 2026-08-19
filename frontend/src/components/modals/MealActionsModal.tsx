import Modal from "@/components/modals/Modal";
import { modalUiStyles } from "@/components/modals/modalUiStyles";

type ListActionButtonProps = {
  label: string;
  icon: string;
  onClick?: () => void;
};

// TODO Split off to reuse
function ListActionButton({ label, icon, onClick }: ListActionButtonProps) {
  return (
    <button
      type="button"
      className={modalUiStyles.list.action}
      onClick={onClick ?? (() => undefined)}
    >
      <div className={modalUiStyles.list.actionContent}>
        <span className={modalUiStyles.list.actionLabel}>
          <i
            className={`bi ${icon} me-2 ${modalUiStyles.list.actionIcon}`}
            aria-hidden="true"
          />
          {label}
        </span>

        <span className={modalUiStyles.list.actionMeta}>
          <i className="bi bi-chevron-right" aria-hidden="true" />
        </span>
      </div>
    </button>
  );
}

type Props = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onFood: () => void;
  onRecipe: () => void;
  onSaveAsRecipe?: () => void;
  onMove?: () => void;
  onSaveToMealPlan?: () => void;
};

export default function MealActionsModal({
  isOpen,
  title,
  onClose,
  onFood,
  onRecipe,
  onSaveAsRecipe,
  onMove,
  onSaveToMealPlan,
}: Props) {
  return (
    <Modal isOpen={isOpen} title={title} onClose={onClose}>
      <div className={modalUiStyles.list.container}>
        <ListActionButton
          label="Add Recipe"
          icon="bi-journal-text"
          onClick={onRecipe}
        />

        <ListActionButton label="Add Food" icon="bi-cake2" onClick={onFood} />

        <ListActionButton
          label="Save as Recipe"
          icon="bi-bookmark-plus"
          onClick={onSaveAsRecipe}
        />

        <ListActionButton
          label="Save to Meal Plan"
          icon="bi-calendar-plus"
          onClick={onSaveToMealPlan}
        />

        <ListActionButton label="Move" icon="bi-arrows-move" onClick={onMove} />
      </div>
    </Modal>
  );
}
