import Modal from "@/components/ui/modals/Modal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onFood: () => void;
  onRecipe: () => void;
};

export default function AddToMealModal({
  isOpen,
  onClose,
  onFood,
  onRecipe,
}: Props) {
  return (
    <Modal isOpen={isOpen} title="Add to meal" onClose={onClose}>
      <div className="d-grid gap-3">
        <button className="btn btn-outline-primary" onClick={onRecipe}>
          <i className="bi bi-journal-text me-2" />
          Search Recipes
        </button>

        <button className="btn btn-outline-primary" onClick={onFood}>
          <i className="bi bi-cake2 me-2" />
          Search Foods
        </button>
      </div>
    </Modal>
  );
}
