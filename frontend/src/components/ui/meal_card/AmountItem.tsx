import type { ReactNode, KeyboardEvent } from "react";

type Props = {
  label: ReactNode;
  amount: ReactNode;
  onClick?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  deleteLabel?: string;
  deleteTitle?: string;
};

export default function AmountItem({
  label,
  amount,
  onClick,
  onDelete,
  isDeleting = false,
  deleteLabel = "Remove",
  deleteTitle = "Remove",
}: Props) {
  function handleKeyDown(event: KeyboardEvent<HTMLLIElement>) {
    if (!onClick) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  }

  return (
    <li
      className="list-group-item list-group-item-action d-flex align-items-center px-1 py-2"
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      <span
        className="text-truncate"
        style={{ minWidth: 0, flex: "1 1 auto" }}
        title={typeof label === "string" ? label : undefined}
      >
        {label}
      </span>

      <span className="d-flex align-items-center gap-0 text-muted flex-shrink-0 ms-3">
        <span className="text-nowrap">{amount}</span>

        {onDelete && (
          <button
            type="button"
            className="btn btn-sm btn-outline-danger border-0"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            disabled={isDeleting}
            aria-label={deleteLabel}
            title={deleteTitle}
          >
            <i className="bi bi-trash" aria-hidden="true" />
          </button>
        )}
      </span>
    </li>
  );
}
