import { useEffect, useRef, useState } from "react";

export interface ItemCardMenuItem {
  key: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
  confirmMessage?: string;
}

interface Props {
  items: ItemCardMenuItem[];
  ariaLabel?: string;
}

export default function ItemCardActions({
  items,
  ariaLabel = "Open actions",
}: Props) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleItemClick(item: ItemCardMenuItem) {
    if (item.confirmMessage) {
      const confirmed = window.confirm(item.confirmMessage);

      if (!confirmed) {
        setOpen(false);
        return;
      }
    }

    item.onClick();
    setOpen(false);
  }

  return (
    <div
      ref={dropdownRef}
      className="dropdown position-relative ms-auto"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="btn btn-sm border-0 bg-transparent p-1"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
      >
        <i className="bi bi-three-dots"></i>
      </button>

      {open && (
        <div
          className="dropdown-menu show text-end"
          role="menu"
          style={{
            minWidth: "max-content",
            right: "100%",
            left: "auto",
            top: 0,
            marginRight: "0.25rem",
          }}
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`dropdown-item text-end item-action-item ${
                item.danger ? "text-danger" : ""
              }`}
              role="menuitem"
              onClick={() => handleItemClick(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <style>
        {`
          .item-action-item:active,
          .item-action-item:focus {
            background-color: var(--bs-dropdown-link-hover-bg);
            color: var(--bs-dropdown-link-hover-color);
          }
        `}
      </style>
    </div>
  );
}
