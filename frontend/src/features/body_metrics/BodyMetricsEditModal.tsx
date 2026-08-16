import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  bodyMetricsBodyMetricsList,
  bodyMetricsBodyMetricLogsList,
  bodyMetricsBodyMetricLogsCreate,
  bodyMetricsBodyMetricLogsPartialUpdate,
} from "@/api/generated";

import type { BodyMetric, BodyMetricLog } from "@/api/generated";

import Modal from "../../components/modals/Modal";

interface BodyMetricsEditModalProps {
  isOpen: boolean;
  /** The diary day (YYYY-MM-DD) these readings belong to. */
  date: string;
  onClose: () => void;
  onSaved?: () => void;
}

type FieldValues = Record<number, string>;

export default function BodyMetricsEditModal({
  isOpen,
  date,
  onClose,
  onSaved,
}: BodyMetricsEditModalProps) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<FieldValues>({});

  const metricsQueryKey = ["body-metrics", "definitions"] as const;

  const {
    data: metrics = [],
    isLoading: isMetricsLoading,
    isError: isMetricsError,
  } = useQuery({
    queryKey: metricsQueryKey,
    queryFn: async () => {
      // NOTE: the generated client requires `path.id` here even though the
      // list URL ('/api/body-metrics/body-metrics/') has no {id} segment.
      // This looks like a bug in the generated client - remove the cast
      // once that's fixed.
      const response = await bodyMetricsBodyMetricsList({
        path: {} as unknown as { id: number },
      });

      return (response.data ?? []).filter(
        (metric: BodyMetric) => metric.visibility.show_in_daily_log,
      );
    },
    enabled: isOpen,
  });

  const logsQueryKey = ["body-metrics", "logs", date] as const;

  const {
    data: existingLogs = [],
    isLoading: isLogsLoading,
    isError: isLogsError,
  } = useQuery({
    queryKey: logsQueryKey,
    queryFn: async () => {
      if (metrics.length === 0) {
        return [] as BodyMetricLog[];
      }

      const perMetric = await Promise.all(
        metrics.map(async (metric) => {
          const response = await bodyMetricsBodyMetricLogsList({
            path: { id: metric.id },
          });

          return response.data ?? [];
        }),
      );

      return perMetric.flat().filter((log) => log.date === date);
    },
    enabled: isOpen && metrics.length > 0,
  });

  // Prefill inputs whenever the modal opens (or the underlying data changes).
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const initial: FieldValues = {};

    for (const metric of metrics) {
      const log = existingLogs.find((l) => l.body_metric === metric.id);
      initial[metric.id] = log ? String(log.amount) : "";
    }

    setValues(initial);
  }, [isOpen, metrics, existingLogs]);

  const createLog = useMutation({
    mutationFn: async (
      options: Parameters<typeof bodyMetricsBodyMetricLogsCreate>[0],
    ) => {
      const response = await bodyMetricsBodyMetricLogsCreate(options);
      return response.data;
    },
  });

  const updateLog = useMutation({
    mutationFn: async (
      options: Parameters<typeof bodyMetricsBodyMetricLogsPartialUpdate>[0],
    ) => {
      const response = await bodyMetricsBodyMetricLogsPartialUpdate(options);
      return response.data;
    },
  });

  const isSaving = createLog.isPending || updateLog.isPending;
  const isLoading = isMetricsLoading || (metrics.length > 0 && isLogsLoading);
  const hasError = isMetricsError || isLogsError;

  function handleChange(metricId: number, raw: string) {
    setValues((prev) => ({ ...prev, [metricId]: raw }));
  }

  function handleClose() {
    setValues({});
    onClose();
  }

  async function handleSave() {
    const tasks = metrics.flatMap((metric) => {
      const raw = values[metric.id];

      if (raw === undefined || raw.trim() === "") {
        return [];
      }

      const amount = Number(raw);

      if (Number.isNaN(amount)) {
        return [];
      }

      const existing = existingLogs.find((l) => l.body_metric === metric.id);

      if (existing) {
        return [
          updateLog.mutateAsync({
            path: { id: existing.id },
            body: { amount },
          }),
        ];
      }

      return [
        createLog.mutateAsync({
          path: { id: metric.id },
          body: {
            body_metric: metric.id,
            date,
            amount,
          },
        }),
      ];
    });

    if (tasks.length === 0) {
      handleClose();
      return;
    }

    await Promise.all(tasks);
    await queryClient.invalidateQueries({ queryKey: logsQueryKey });

    onSaved?.();
    handleClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Body Metrics"
      onClose={handleClose}
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving || isLoading}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      }
    >
      {hasError && (
        <div className="alert alert-danger">Failed to load body metrics.</div>
      )}

      {isLoading && !hasError && <div>Loading...</div>}

      {!isLoading && !hasError && metrics.length === 0 && (
        <div className="alert alert-secondary">
          No body metrics configured for the daily log.
        </div>
      )}

      {!isLoading && !hasError && metrics.length > 0 && (
        <div className="d-flex flex-column gap-3">
          {metrics.map((metric: BodyMetric) => (
            <div key={metric.id} className="d-flex flex-column gap-1">
              <label
                htmlFor={`body-metric-${metric.id}`}
                className="form-label mb-0"
              >
                {metric.name}
                {/* TODO add units {metric.unit ? ` (${metric.unit})` : ""} */}
              </label>

              <input
                id={`body-metric-${metric.id}`}
                type="number"
                inputMode="decimal"
                step="any"
                className="form-control"
                value={values[metric.id] ?? ""}
                onChange={(e) => handleChange(metric.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
