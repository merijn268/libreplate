import Modal from "@/components/modals/Modal";

type Props = {
  isOpen: boolean;
  title: string;
  itemName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
};

export default function DeleteAmountModal({
  isOpen,
  title,
  itemName,
  onClose,
  onConfirm,
  isDeleting = false,
}: Props) {
  async function handleConfirm() {
    await onConfirm();
  }

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={isDeleting ? () => undefined : onClose}
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-danger"
            onClick={() => void handleConfirm()}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      }
    >
      <p className="mb-0">
        Are you sure you want to remove <strong>{itemName}</strong>?
      </p>
    </Modal>
  );
}
