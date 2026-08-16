import { useState } from "react";

import type {
  BodyMetric,
  GraphLine,
  MovingAverageUnitEnum,
} from "@/api/generated/types.gen";

import {
  createGraphLine,
  deleteGraphLine,
  updateGraphLine,
} from "../utils/api";

type Props = {
  graphId: number;
  bodyMetrics: BodyMetric[];
  line?: GraphLine;
  onSaved: (line: GraphLine) => void;
  onDeleted: (lineId: number) => void;
  onCancelNew?: () => void;
};

const MOVING_AVERAGE_OPTIONS: {
  value: MovingAverageUnitEnum | "";
  label: string;
}[] = [
  { value: "", label: "None" },
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

export default function GraphLineFormRow({
  graphId,
  bodyMetrics,
  line,
  onSaved,
  onDeleted,
  onCancelNew,
}: Props) {
  const isNew = !line;

  const [name, setName] = useState(line?.name ?? "");
  const [description, setDescription] = useState(line?.description ?? "");
  const [bodyMetricId, setBodyMetricId] = useState<number | null>(
    line?.body_metric?.body_metric ?? null,
  );
  const [movingAverageUnit, setMovingAverageUnit] = useState<
    MovingAverageUnitEnum | ""
  >((line?.moving_average_unit as MovingAverageUnitEnum) || "");
  const [movingAverageAmount, setMovingAverageAmount] = useState(
    line?.moving_average_amount ?? 1,
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim().length > 0 && bodyMetricId !== null;

  async function handleSave() {
    if (!canSave || bodyMetricId === null) return;

    setSaving(true);
    setError(null);

    const payload = {
      graph: graphId,
      name: name.trim(),
      description: description.trim() || undefined,
      moving_average_unit: movingAverageUnit || null,
      moving_average_amount: movingAverageUnit
        ? movingAverageAmount
        : undefined,
      body_metric: { body_metric: bodyMetricId },
    };

    try {
      const saved = line
        ? await updateGraphLine(line.id, payload)
        : await createGraphLine(payload);
      onSaved(saved);
    } catch {
      setError("Couldn't save this line.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!line) {
      onCancelNew?.();
      return;
    }

    const confirmed = window.confirm(`Remove the line "${line.name}"?`);
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      await deleteGraphLine(line.id);
      onDeleted(line.id);
    } catch {
      setError("Couldn't remove this line.");
      setDeleting(false);
    }
  }

  return (
    <div className="border rounded p-3 mb-3">
      <div className="row g-2">
        <div className="col-md-6">
          <label className="form-label small">Name</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Body weight"
          />
        </div>

        <div className="col-md-6">
          <label className="form-label small">Body metric</label>
          <select
            className="form-select form-select-sm"
            value={bodyMetricId ?? ""}
            onChange={(e) =>
              setBodyMetricId(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">Select a body metric…</option>
            {bodyMetrics.map((metric) => (
              <option key={metric.id} value={metric.id}>
                {metric.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12">
          <label className="form-label small">Description</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="col-md-6">
          <label className="form-label small">Moving average</label>
          <select
            className="form-select form-select-sm"
            value={movingAverageUnit}
            onChange={(e) =>
              setMovingAverageUnit(e.target.value as MovingAverageUnitEnum | "")
            }
          >
            {MOVING_AVERAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {movingAverageUnit && (
          <div className="col-md-6">
            <label className="form-label small">Over</label>
            <input
              type="number"
              min={1}
              className="form-control form-control-sm"
              value={movingAverageAmount}
              onChange={(e) => setMovingAverageAmount(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      {error && <p className="text-danger small mt-2 mb-0">{error}</p>}

      <div className="d-flex gap-2 mt-3">
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={handleSave}
          disabled={!canSave || saving}
        >
          {saving ? "Saving…" : isNew ? "Add line" : "Save line"}
        </button>

        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          onClick={handleDelete}
          disabled={deleting}
        >
          {isNew ? "Cancel" : deleting ? "Removing…" : "Remove"}
        </button>
      </div>
    </div>
  );
}
