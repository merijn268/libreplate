import { useNavigate } from "react-router-dom";

import ItemCardActions, {
  type ItemCardMenuItem,
} from "@/components/ItemCardActions";
import type { Graph } from "@/api/generated/types.gen";

import { getLineColor } from "../utils/colors";
import GraphChart from "./GraphChart";

type Props = {
  graph: Graph;
  onToggleFavorite: (graph: Graph) => void;
  onDuplicate: (graph: Graph) => void;
  onDelete: (graph: Graph) => void;
};

export default function GraphCard({
  graph,
  onToggleFavorite,
  onDuplicate,
  onDelete,
}: Props) {
  const navigate = useNavigate();

  const menuItems: ItemCardMenuItem[] = [
    {
      key: "edit",
      label: "Edit",
      onClick: () => navigate(`/statistics/${graph.id}/edit`),
    },
    {
      key: "favorite",
      label: graph.is_favorite ? "Unfavorite" : "Favorite",
      onClick: () => onToggleFavorite(graph),
    },
    {
      key: "duplicate",
      label: "Duplicate",
      onClick: () => onDuplicate(graph),
    },
    {
      key: "delete",
      label: "Delete",
      danger: true,
      confirmMessage: `Delete "${graph.name}"? This can't be undone.`,
      onClick: () => onDelete(graph),
    },
  ];

  return (
    <div className="card mb-4 app-surface shadow-sm">
      <div className="card-body">
        <div className="d-flex align-items-start">
          <div>
            <h5 className="card-title mb-1 d-flex align-items-center gap-2">
              {graph.name}
              {graph.is_favorite && (
                <i
                  className="bi bi-star-fill text-warning"
                  style={{ fontSize: "0.8rem" }}
                  aria-label="Favorited"
                ></i>
              )}
            </h5>
            {graph.description && (
              <p className="card-text text-muted small mb-2">
                {graph.description}
              </p>
            )}
          </div>

          <ItemCardActions
            items={menuItems}
            ariaLabel={`Actions for ${graph.name}`}
          />
        </div>

        {graph.lines.length > 0 ? (
          <>
            <div className="d-flex flex-wrap gap-3 mb-2">
              {graph.lines.map((line, index) => (
                <span
                  key={line.id}
                  className="d-flex align-items-center gap-1 small"
                >
                  <span
                    className="rounded-circle d-inline-block"
                    style={{
                      width: 10,
                      height: 10,
                      backgroundColor: getLineColor(index),
                    }}
                  />
                  {line.name}
                </span>
              ))}
            </div>

            <GraphChart graph={graph} />
          </>
        ) : (
          <p className="text-muted small mb-0">
            This graph has no lines yet. Edit it to add one.
          </p>
        )}
      </div>
    </div>
  );
}
