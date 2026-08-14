import type { ReactNode } from "react";

type ActionPillButtonGroupProps = {
  children: ReactNode;
};

export default function ActionPillButtonGroup({
  children,
}: ActionPillButtonGroupProps) {
  return (
    <div className="row row-cols-2 row-cols-md-3 g-2 my-1">
      {Array.isArray(children)
        ? children.map((child, index) => (
            <div className="col" key={index}>
              {child}
            </div>
          ))
        : children}
    </div>
  );
}
