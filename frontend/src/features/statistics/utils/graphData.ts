import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  parseISO,
  subDays,
} from "date-fns";

import type {
  BodyMetricLog,
  Graph,
  GraphLine,
  PeriodUnitEnum,
} from "@/api/generated/types.gen";

export type SeriesPoint = { date: string; value: number };
export type LineSeries = { line: GraphLine; points: SeriesPoint[] };
export type ChartPoint = { date: string } & Record<
  string,
  number | null | string
>;

const UNIT_TO_DAYS: Record<string, number> = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
};

function subtractPeriod(
  date: Date,
  unit: PeriodUnitEnum,
  amount: number,
): Date {
  switch (unit) {
    case "day":
      return addDays(date, -amount);
    case "week":
      return addWeeks(date, -amount);
    case "month":
      return addMonths(date, -amount);
    case "year":
      return addYears(date, -amount);
    case "all":
    default:
      return date;
  }
}

/**
 * Resolves the [start, end] window a graph's chart should render, based on
 * its period_unit/period_amount/period_end_mode settings. `start` is `null`
 * when period_unit is "all" (show everything).
 *
 * NOTE: `range_type` (fixed vs dynamic) isn't factored in yet — its exact
 * semantics weren't fully specified, so both modes currently resolve the
 * same way. Revisit once that's pinned down.
 */
export function resolveDateRange(
  graph: Graph,
  allLogs: BodyMetricLog[],
): { start: Date | null; end: Date } {
  const periodUnit: PeriodUnitEnum = graph.period_unit ?? "all";

  let end: Date;

  if (graph.period_end_mode === "custom" && graph.period_end_date) {
    end = parseISO(graph.period_end_date);
  } else if (graph.period_end_mode === "now") {
    end = new Date();
  } else {
    const lastLogDate = allLogs.reduce<Date | null>((latest, log) => {
      const date = parseISO(log.date);
      return !latest || date > latest ? date : latest;
    }, null);
    end = lastLogDate ?? new Date();
  }

  if (periodUnit === "all") {
    return { start: null, end };
  }

  const start = subtractPeriod(end, periodUnit, graph.period_amount ?? 1);
  return { start, end };
}

export function filterPointsInRange(
  points: SeriesPoint[],
  start: Date | null,
  end: Date,
): SeriesPoint[] {
  return points.filter((point) => {
    const date = parseISO(point.date);
    if (start && date < start) return false;
    if (date > end) return false;
    return true;
  });
}

/**
 * Averages each point over a trailing window sized by moving_average_unit *
 * moving_average_amount (converted to a rough day count). Returns the
 * points unchanged if no moving average unit is set.
 */
export function applyMovingAverage(
  points: SeriesPoint[],
  unit: string | null | undefined,
  amount: number | undefined,
): SeriesPoint[] {
  if (!unit) return points;

  const windowDays = (UNIT_TO_DAYS[unit] ?? 1) * (amount ?? 1);
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));

  return sorted.map((point) => {
    const pointDate = parseISO(point.date);
    const windowStart = subDays(pointDate, windowDays);

    const windowPoints = sorted.filter((candidate) => {
      const date = parseISO(candidate.date);
      return date >= windowStart && date <= pointDate;
    });

    const average =
      windowPoints.reduce((sum, candidate) => sum + candidate.value, 0) /
      windowPoints.length;

    return { date: point.date, value: average };
  });
}

export function lineKey(line: GraphLine): string {
  return `line_${line.id}`;
}

/** Merges multiple sparse line series into one array recharts can consume. */
export function buildChartData(seriesList: LineSeries[]): ChartPoint[] {
  const dateSet = new Set<string>();
  seriesList.forEach((series) =>
    series.points.forEach((point) => dateSet.add(point.date)),
  );

  const dates = Array.from(dateSet).sort();

  return dates.map((date) => {
    const point: ChartPoint = { date };

    seriesList.forEach((series) => {
      const match = series.points.find((candidate) => candidate.date === date);
      point[lineKey(series.line)] = match ? match.value : null;
    });

    return point;
  });
}
