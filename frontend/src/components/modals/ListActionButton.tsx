type ListActionButtonProps = {
  label: string;
  icon: string;
  onClick?: () => void;
};

// TODO its not just modal style!
import { modalUiStyles } from "@/components/modals/modalUiStyles";

export function ListActionButton({
  label,
  icon,
  onClick,
}: ListActionButtonProps) {
  return (
    <button
      type="button"
      className={modalUiStyles.list.action}
      onClick={onClick ?? (() => undefined)}
    >
      <div className={modalUiStyles.list.actionContent}>
        <span className={modalUiStyles.list.actionLabel}>
          <i
            className={`bi ${icon} me-2 ${modalUiStyles.list.actionIcon}`}
            aria-hidden="true"
          />
          {label}
        </span>

        <span className={modalUiStyles.list.actionMeta}>
          <i className="bi bi-chevron-right" aria-hidden="true" />
        </span>
      </div>
    </button>
  );
}
