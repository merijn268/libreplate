import { format, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  const bodyMetricLines = useMemo(
    () => graph.lines.filter((line) => line.body_metric),
    [graph.lines],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const allLogs = await Promise.all(
          bodyMetricLines.map((line) =>
            listBodyMetricLogs(line.body_metric!.body_metric),
          ),
        );

        if (cancelled) return;

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

        setChartData(buildChartData(series));
      } catch {
        if (!cancelled) {
          setError("Couldn't load data for this graph.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (bodyMetricLines.length > 0) {
      load();
    } else {
      setChartData([]);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [graph, bodyMetricLines]);

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

  if (error) {
    return <div className="text-danger small py-4 text-center">{error}</div>;
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

        <Tooltip
          labelFormatter={(label) =>
            typeof label === "string"
              ? format(parseISO(label), "MMM d, yyyy")
              : String(label ?? "")
          }
        />

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
              type="monotone"
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
