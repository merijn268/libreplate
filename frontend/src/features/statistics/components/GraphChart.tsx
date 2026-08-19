import { format, parseISO } from "date-fns";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import type { Graph } from "@/api/generated/types.gen";

import { listBodyMetricLogs } from "../utils/api";
import { getLineColor } from "../utils/colors";
import {
  applyMovingAverage,
  buildChartData,
  filterPointsInRange,
  lineKey,
  resolveDateRange,
  type ChartPoint,
} from "../utils/graphData";

type Props = {
  graph: Graph;
};

export default function GraphChart({ graph }: Props) {
  const bodyMetricLines = useMemo(
    () => graph.lines.filter((line) => line.body_metric),
    [graph.lines],
  );

  // Data fetching + derived chart data now lives in react-query instead of a
  // useEffect + setState trio. react-query hashes the query key by value, so
  // this only refetches when `graph`/`bodyMetricLines` actually change in
  // content, not merely by reference.
  const chartQuery = useQuery({
    queryKey: ["graph-chart", graph, bodyMetricLines],
    queryFn: async (): Promise<ChartPoint[]> => {
      const allLogs = await Promise.all(
        bodyMetricLines.map((line) =>
          listBodyMetricLogs(line.body_metric!.body_metric),
        ),
      );

      const { start, end } = resolveDateRange(graph, allLogs.flat());

      const series = bodyMetricLines.map((line, index) => {
        const rawPoints = (allLogs[index] ?? [])
          .map((log) => ({
            date: log.date,
            value: log.amount,
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        const averaged = applyMovingAverage(
          rawPoints,
          line.moving_average_unit,
          line.moving_average_amount,
        );

        return {
          line,
          points: filterPointsInRange(averaged, start, end),
        };
      });

      return buildChartData(series);
    },
    enabled: bodyMetricLines.length > 0,
  });

  // Memoized so the `[]` fallback doesn't produce a new array reference on
  // every render (which would otherwise make the yDomain useMemo below
  // recompute every time regardless of its dependencies).
  const chartData = useMemo(
    () => (bodyMetricLines.length > 0 ? (chartQuery.data ?? []) : []),
    [bodyMetricLines, chartQuery.data],
  );

  const loading = bodyMetricLines.length > 0 && chartQuery.isLoading;
  const hasError = bodyMetricLines.length > 0 && chartQuery.isError;

  const yDomain = useMemo(() => {
    const values = chartData.flatMap((point) =>
      bodyMetricLines
        .map((line) => point[lineKey(line)])
        .filter((value): value is number => typeof value === "number"),
    );

    if (values.length === 0) {
      return ["auto", "auto"] as const;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min === max) {
      return [min - 1, max + 1] as const;
    }

    return [min, max] as const;
  }, [chartData, bodyMetricLines]);

  if (loading) {
    return (
      <div className="text-muted small py-4 text-center">Loading chart…</div>
    );
  }

  if (hasError) {
    return (
      <div className="text-danger small py-4 text-center">
        Couldn't load data for this graph.
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="text-muted small py-4 text-center">
        No data in this date range yet.
      </div>
    );
  }

  const ChartComponent = graph.graph_type === "bar" ? BarChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ChartComponent data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />

        <XAxis
          dataKey="date"
          tickFormatter={(value: string) => format(parseISO(value), "MMM d")}
          tick={{ fontSize: 12 }}
        />

        <YAxis domain={yDomain} tick={{ fontSize: 12 }} width={40} />

        {bodyMetricLines.map((line, index) =>
          graph.graph_type === "bar" ? (
            <Bar
              key={line.id}
              dataKey={lineKey(line)}
              name={line.name}
              fill={getLineColor(index)}
            />
          ) : (
            <Line
              key={line.id}
              type="linear"
              dataKey={lineKey(line)}
              name={line.name}
              stroke={getLineColor(index)}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ),
        )}
      </ChartComponent>
    </ResponsiveContainer>
  );
}
