import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  title?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({
  isOpen,
  title,
  onClose,
  children,
  footer,
}: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <style>
        {`
          .modal-responsive {
            width: 400px;
          }

          @media (min-width: 700px) {
            .modal-responsive {
              width: 600px;
            }
          }
        `}
      </style>

      <div
        onClick={onClose}
        className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
        style={{
          background: "rgba(0, 0, 0, 0.4)",
          zIndex: 1050,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="app-surface modal-responsive rounded-3 shadow-lg d-flex flex-column p-3"
          style={{
            maxHeight: "80vh",
          }}
        >
          <h4 className="mb-3">{title}</h4>

          <div className="flex-grow-1 overflow-auto" style={{ minHeight: 0 }}>
            {children}
          </div>

          {footer && <div className="mt-3">{footer}</div>}
        </div>
      </div>
    </>
  );
}
