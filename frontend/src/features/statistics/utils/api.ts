import {
  bodyMetricsBodyMetricLogsList,
  bodyMetricsBodyMetricsList,
  userStatisticsGraphLinesCreate,
  userStatisticsGraphLinesDestroy,
  userStatisticsGraphLinesPartialUpdate,
  userStatisticsGraphsCreate,
  userStatisticsGraphsDestroy,
  userStatisticsGraphsList,
  userStatisticsGraphsPartialUpdate,
  userStatisticsGraphsRetrieve,
} from "@/api/generated/sdk.gen";
import type {
  BodyMetric,
  BodyMetricLog,
  Graph,
  GraphLine,
  GraphLineWritable,
  GraphWritable,
  PatchedGraphLineWritable,
  PatchedGraphWritable,
} from "@/api/generated/types.gen";

export async function listGraphs(): Promise<Graph[]> {
  const { data, error } = await userStatisticsGraphsList();
  if (error || !data) throw new Error("Failed to load graphs.");
  return data;
}

export async function getGraph(id: number): Promise<Graph> {
  const { data, error } = await userStatisticsGraphsRetrieve({ path: { id } });
  if (error || !data) throw new Error("Failed to load graph.");
  return data;
}

export async function createGraph(body: GraphWritable): Promise<Graph> {
  const { data, error } = await userStatisticsGraphsCreate({ body });
  if (error || !data) throw new Error("Failed to create graph.");
  return data;
}

export async function updateGraph(
  id: number,
  body: PatchedGraphWritable,
): Promise<Graph> {
  const { data, error } = await userStatisticsGraphsPartialUpdate({
    path: { id },
    body,
  });
  if (error || !data) throw new Error("Failed to update graph.");
  return data;
}

export async function deleteGraph(id: number): Promise<void> {
  const { error } = await userStatisticsGraphsDestroy({ path: { id } });
  if (error) throw new Error("Failed to delete graph.");
}

export async function createGraphLine(
  body: GraphLineWritable,
): Promise<GraphLine> {
  const { data, error } = await userStatisticsGraphLinesCreate({ body });
  if (error || !data) throw new Error("Failed to create line.");
  return data;
}

export async function updateGraphLine(
  id: number,
  body: PatchedGraphLineWritable,
): Promise<GraphLine> {
  const { data, error } = await userStatisticsGraphLinesPartialUpdate({
    path: { id },
    body,
  });
  if (error || !data) throw new Error("Failed to update line.");
  return data;
}

export async function deleteGraphLine(id: number): Promise<void> {
  const { error } = await userStatisticsGraphLinesDestroy({ path: { id } });
  if (error) throw new Error("Failed to delete line.");
}

// NOTE: the generated types for BOTH body-metric endpoints below require a
// `path.id`, even the *list* endpoints (whose URLs have no {id} segment in
// the generated schema). That looks like a schema-generation quirk on the
// backend (apps/body_metrics urls). `listBodyMetrics` has no natural id to
// pass, so the call is cast through `as never` to satisfy the generated
// signature — worth fixing on the backend so this cast can be removed.
export async function listBodyMetrics(): Promise<BodyMetric[]> {
  const { data, error } = await bodyMetricsBodyMetricsList({
    path: {},
  } as never);
  if (error || !data) throw new Error("Failed to load body metrics.");
  return data;
}

export async function listBodyMetricLogs(
  bodyMetricId: number,
): Promise<BodyMetricLog[]> {
  const { data, error } = await bodyMetricsBodyMetricLogsList({
    path: { id: bodyMetricId },
  });
  if (error || !data) throw new Error("Failed to load body metric logs.");
  return data;
}
