import type { Graph } from "@/api/generated/types.gen";

import { createGraph, createGraphLine } from "./api";

/** Creates a copy of a graph (and its body-metric lines) and returns it. */
export async function createGraphCopy(graph: Graph): Promise<Graph> {
  const copy = await createGraph({
    name: `${graph.name} (copy)`,
    description: graph.description,
    is_favorite: false,
    graph_type: graph.graph_type,
    period_unit: graph.period_unit,
    period_amount: graph.period_amount,
    period_end_mode: graph.period_end_mode,
    period_end_date: graph.period_end_date,
    range_type: graph.range_type,
  });

  for (const line of graph.lines) {
    // Nutrient lines are skipped — nutrients aren't implemented yet.
    if (!line.body_metric) continue;

    await createGraphLine({
      graph: copy.id,
      name: line.name,
      description: line.description,
      moving_average_unit: line.moving_average_unit,
      moving_average_amount: line.moving_average_amount,
      body_metric: line.body_metric,
    });
  }

  return copy;
}
