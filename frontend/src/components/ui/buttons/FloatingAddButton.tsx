type FloatingAddButtonProps = {
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
      className="btn btn-primary rounded-circle position-fixed shadow d-flex align-items-center justify-content-center"
      style={{
        width: "45px",
        height: "45px",
        right: "24px",
        bottom: "24px",
        zIndex: 1050,
        fontSize: "32px",
        lineHeight: 1,
      }}
      onClick={onClick}
      disabled={disabled}
      aria-label="Add"
    >
      +
    </button>
  );
}
