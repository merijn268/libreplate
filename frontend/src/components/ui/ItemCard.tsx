import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
}

export default function ItemCard({ title, meta, actions, onClick }: Props) {
  return (
    <div className="card rounded-2" role="button" onClick={onClick}>
      <div className="card-body p-2">
        <div className="d-flex align-items-start">
          <div className="flex-grow-1">
            <h5 className="card-title mb-0">{title}</h5>
          </div>

          {actions && (
            <div className="ms-2" onClick={(e) => e.stopPropagation()}>
              {actions}
            </div>
          )}
        </div>

        {meta && <div className="text-muted small mt-0">{meta}</div>}
      </div>
    </div>
  );
}
