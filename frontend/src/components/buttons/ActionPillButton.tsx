import type { MouseEventHandler } from "react";

type ActionPillButtonProps = {
  label: string;
  /** Bootstrap Icons class, e.g. "bi-clipboard-check" (no need to include "bi") */
  icon?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  loading?: boolean;
};

export default function ActionPillButton({
  label,
  icon,
  onClick,
  disabled = false,
  loading = false,
}: ActionPillButtonProps) {
  return (
    <button
      type="button"
      className="btn btn-primary rounded-3 d-flex align-items-center justify-content-center gap-1 w-100 py-2 px-2 fw-semibold shadow-sm small"
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <span
          className="spinner-border spinner-border-sm"
          role="status"
          aria-hidden="true"
        />
      ) : (
        icon && <i className={`bi ${icon}`} aria-hidden="true" />
      )}
      <span>{label}</span>
    </button>
  );
}
