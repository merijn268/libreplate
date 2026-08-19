/**
 * Floating add button fixed to the bottom-right corner.
 */

type FloatingAddButtonProps = {
  onClick: () => void;
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
        m-3
        d-flex
        align-items-center
        justify-content-center
        p-0
        floating-add-button
      "
      style={{
        width: "56px",
        height: "56px",
        minWidth: "56px",
        minHeight: "56px",
        border: "none",
        fontSize: "2rem",
        fontWeight: 400,
        lineHeight: 1,
        boxShadow:
          "0 3px 5px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.14)",
        transition: "box-shadow 0.15s ease, transform 0.1s ease",
      }}
      onClick={onClick}
      disabled={disabled}
      aria-label="Add"
    >
      <span
        className="text-white"
        style={{
          position: "relative",
          top: "-1px",
          fontWeight: 300,
        }}
      >
        +
      </span>
    </button>
  );
}
