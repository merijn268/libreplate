import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import FloatingAddButton from "@/components/buttons/FloatingAddButton";
import type { Graph } from "@/api/generated/types.gen";

import GraphCard from "./components/GraphCard";
import { deleteGraph, listGraphs, updateGraph } from "./utils/api";
import { createGraphCopy } from "./utils/duplicateGraph";

export default function StatisticsPage() {
  const navigate = useNavigate();

  const [graphs, setGraphs] = useState<Graph[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listGraphs()
      .then((data) => {
        if (!cancelled) setGraphs(data);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your graphs.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleToggleFavorite(graph: Graph) {
    const updated = await updateGraph(graph.id, {
      is_favorite: !graph.is_favorite,
    });
    setGraphs((prev) => prev.map((g) => (g.id === graph.id ? updated : g)));
  }

  async function handleDelete(graph: Graph) {
    await deleteGraph(graph.id);
    setGraphs((prev) => prev.filter((g) => g.id !== graph.id));
  }

  async function handleDuplicate(graph: Graph) {
    const copy = await createGraphCopy(graph);
    navigate(`/statistics/${copy.id}/edit`);
  }

  return (
    <div className="container">
      {loading && <p className="text-muted">Loading graphs…</p>}
      {error && <p className="text-danger">{error}</p>}

      {!loading && !error && graphs.length === 0 && (
        <p className="text-muted">
          You haven&apos;t created any graphs yet. Tap the + button to create
          your first one.
        </p>
      )}

      {graphs.map((graph) => (
        <GraphCard
          key={graph.id}
          graph={graph}
          onToggleFavorite={handleToggleFavorite}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      ))}

      <FloatingAddButton onClick={() => navigate("/statistics/new")} />
    </div>
  );
}
