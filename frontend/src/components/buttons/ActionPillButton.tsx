import type { MouseEventHandler } from "react";

type ActionPillButtonProps = {
  label: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  loading?: boolean;
};

export default function ActionPillButton({
  label,
  onClick,
  disabled = false,
  loading = false,
}: ActionPillButtonProps) {
  return (
    <button
      type="button"
      className="app-surface btn rounded-2 d-flex align-items-center justify-content-start gap-1 w-100 py-2 px-3 fw-semibold text-start"
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <span
          className="spinner-border spinner-border-sm text-primary"
          role="status"
          aria-hidden="true"
        />
      ) : (
        <i
          className="bi bi-plus-lg fs-5 fw-bold text-primary"
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </button>
  );
}
