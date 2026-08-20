import Modal from "@/components/modals/Modal";
import { ListActionButton } from "@/components/modals/ListActionButton";
import { modalUiStyles } from "@/components/modals/modalUiStyles";

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

        {/* <ListActionButton
          label="Save to Meal Plan"
          icon="bi-calendar-plus"
          onClick={onSaveToMealPlan}
        /> */}

        {/* <ListActionButton
          label="Move"
          icon="bi-arrows-move"
          onClick={onMove} 
        /> */}
      </div>
    </Modal>
  );
}
