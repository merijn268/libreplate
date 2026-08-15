import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, type Icon } from "react-bootstrap-icons";

interface SettingsListItemProps {
  icon: Icon;
  label: string;
  description?: string;
  /** Navigates to a sub-page (renders as a link) */
  to?: string;
  /** Handles the tap directly instead of navigating */
  onClick?: () => void;
  /** Overrides the default trailing chevron, e.g. with a switch */
  trailing?: ReactNode;
}

// Bootstrap's own docs use `.list-group-item.list-group-item-action` on both
// <a> and <button> for tappable rows - it already handles hover/focus/active
// and (for buttons) full width + inherited text alignment, so no custom CSS
// is needed here.
export default function SettingsListItem({
  icon: ItemIcon,
  label,
  description,
  to,
  onClick,
  trailing,
}: SettingsListItemProps) {
  const className =
    "list-group-item list-group-item-action d-flex align-items-center gap-3 py-2";

  const content = (
    <>
      <ItemIcon className="flex-shrink-0 text-body-secondary" />
      <div className="flex-grow-1 text-truncate">
        <div className="fw-medium">{label}</div>
        {description && (
          <div className="text-body-secondary small text-truncate">
            {description}
          </div>
        )}
      </div>
      {trailing ??
        (to && (
          <ChevronRight
            className="flex-shrink-0 text-body-secondary"
            size={16}
          />
        ))}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
