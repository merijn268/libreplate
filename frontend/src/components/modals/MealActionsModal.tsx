import Modal from "@/components/modals/Modal";
import { modalUiStyles } from "@/components/modals/modalUiStyles";

// TODO, actions should be configurable per user!
// Other action ideas:
// * Multiply amounts
// * Fit to goals
// * Clear all
// * Move (select which items to move)
// * Edit meal plan occurance
// * Balance macros
// * Add to grocery list
// * Export to pdf
// * Alternatives button

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
        <button
          type="button"
          className={modalUiStyles.list.action}
          onClick={onRecipe}
        >
          <div className={modalUiStyles.list.actionContent}>
            <span className={modalUiStyles.list.actionLabel}>
              <i
                className={`bi bi-journal-text me-2 ${modalUiStyles.list.actionIcon}`}
                aria-hidden="true"
              />
              Add Recipe
            </span>

            <span className={modalUiStyles.list.actionMeta}>
              <i
                className={`bi bi-chevron-right ${modalUiStyles.list.actionIcon}`}
                aria-hidden="true"
              />
            </span>
          </div>
        </button>

        <button
          type="button"
          className={modalUiStyles.list.action}
          onClick={onFood}
        >
          <div className={modalUiStyles.list.actionContent}>
            <span className={modalUiStyles.list.actionLabel}>
              <i
                className={`bi bi-cake2 me-2 ${modalUiStyles.list.actionIcon}`}
                aria-hidden="true"
              />
              Add Food
            </span>

            <span className={modalUiStyles.list.actionMeta}>
              <i
                className={`bi bi-chevron-right ${modalUiStyles.list.actionIcon}`}
                aria-hidden="true"
              />
            </span>
          </div>
        </button>

        <button
          type="button"
          className={modalUiStyles.list.action}
          onClick={onSaveAsRecipe ?? (() => undefined)}
        >
          <div className={modalUiStyles.list.actionContent}>
            <span className={modalUiStyles.list.actionLabel}>
              <i
                className={`bi bi-bookmark-plus me-2 ${modalUiStyles.list.actionIcon}`}
                aria-hidden="true"
              />
              Save as Recipe
            </span>

            <span className={modalUiStyles.list.actionMeta}>
              <i
                className={`bi bi-chevron-right ${modalUiStyles.list.actionIcon}`}
                aria-hidden="true"
              />
            </span>
          </div>
        </button>

        <button
          type="button"
          className={modalUiStyles.list.action}
          onClick={onSaveToMealPlan ?? (() => undefined)}
        >
          <div className={modalUiStyles.list.actionContent}>
            <span className={modalUiStyles.list.actionLabel}>
              <i
                className={`bi bi-calendar-plus me-2 ${modalUiStyles.list.actionIcon}`}
                aria-hidden="true"
              />
              Save to Meal Plan
            </span>

            <span className={modalUiStyles.list.actionMeta}>
              <i
                className={`bi bi-chevron-right ${modalUiStyles.list.actionIcon}`}
                aria-hidden="true"
              />
            </span>
          </div>
        </button>

        <button
          type="button"
          className={modalUiStyles.list.action}
          onClick={onMove ?? (() => undefined)}
        >
          <div className={modalUiStyles.list.actionContent}>
            <span className={modalUiStyles.list.actionLabel}>
              <i
                className={`bi bi-arrows-move me-2 ${modalUiStyles.list.actionIcon}`}
                aria-hidden="true"
              />
              Move
            </span>

            <span className={modalUiStyles.list.actionMeta}>
              <i
                className={`bi bi-chevron-right ${modalUiStyles.list.actionIcon}`}
                aria-hidden="true"
              />
            </span>
          </div>
        </button>
      </div>
    </Modal>
  );
}
