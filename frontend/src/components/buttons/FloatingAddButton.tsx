/**
 * Floating add button fixed to the bottom-right corner.
 */

type FloatingAddButtonProps = {
  // TODO, don't make optional
  onClick?: () => void;
  disabled?: boolean;
};

export default function FloatingAddButton({
  onClick,
  disabled = false,
}: FloatingAddButtonProps) {
  return (
    <button
      type="button"
      className="
        btn
        btn-primary
        rounded-circle
        position-fixed
        bottom-0
        end-0
        m-4
        shadow
        d-flex
        align-items-center
        justify-content-center
        fs-1
        fw-bold
        lh-1
      "
      onClick={onClick}
      disabled={disabled}
      aria-label="Add"
    >
      <span className="text-body">+</span>
    </button>
  );
}
