import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import type {
  BodyMetric,
  Graph,
  GraphLine,
  GraphTypeEnum,
  PeriodEndModeEnum,
  PeriodUnitEnum,
  RangeTypeEnum,
} from "@/api/generated/types.gen";

import GraphLineFormRow from "./components/GraphLineFormRow";
import {
  createGraph,
  getGraph,
  listBodyMetrics,
  updateGraph,
} from "./utils/api";

const GRAPH_TYPE_OPTIONS: { value: GraphTypeEnum; label: string }[] = [
  { value: "line", label: "Line graph" },
  { value: "bar", label: "Bar graph" },
];

const PERIOD_UNIT_OPTIONS: { value: PeriodUnitEnum; label: string }[] = [
  { value: "all", label: "All data" },
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const PERIOD_END_MODE_OPTIONS: { value: PeriodEndModeEnum; label: string }[] = [
  { value: "last_data_point", label: "Last data point" },
  { value: "now", label: "Now" },
  { value: "custom", label: "Custom date" },
];

const RANGE_TYPE_OPTIONS: { value: RangeTypeEnum; label: string }[] = [
  { value: "dynamic", label: "Dynamic" },
  { value: "fixed", label: "Fixed" },
];

type FormState = {
  name: string;
  description: string;
  is_favorite: boolean;
  graph_type: GraphTypeEnum;
  period_unit: PeriodUnitEnum;
  period_amount: number;
  period_end_mode: PeriodEndModeEnum;
  period_end_date: string;
  range_type: RangeTypeEnum;
};

const DEFAULT_FORM: FormState = {
  name: "",
  description: "",
  is_favorite: false,
  graph_type: "line",
  period_unit: "month",
  period_amount: 1,
  period_end_mode: "last_data_point",
  period_end_date: "",
  range_type: "dynamic",
};

function graphToForm(graph: Graph): FormState {
  return {
    name: graph.name,
    description: graph.description ?? "",
    is_favorite: graph.is_favorite ?? false,
    graph_type: graph.graph_type,
    period_unit: graph.period_unit ?? "all",
    period_amount: graph.period_amount ?? 1,
    period_end_mode: graph.period_end_mode ?? "last_data_point",
    period_end_date: graph.period_end_date ?? "",
    range_type: graph.range_type ?? "dynamic",
  };
}

export default function StatisticsEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [lines, setLines] = useState<GraphLine[]>([]);
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([]);
  const [addingLine, setAddingLine] = useState(false);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listBodyMetrics()
      .then((data) => setBodyMetrics(data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isNew) return;

    let cancelled = false;

    getGraph(Number(id))
      .then((graph) => {
        if (cancelled) return;
        setForm(graphToForm(graph));
        setLines(graph.lines);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this graph.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Give this graph a name.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      is_favorite: form.is_favorite,
      graph_type: form.graph_type,
      period_unit: form.period_unit,
      period_amount: form.period_amount,
      period_end_mode: form.period_end_mode,
      period_end_date:
        form.period_end_mode === "custom" && form.period_end_date
          ? form.period_end_date
          : null,
      range_type: form.range_type,
    };

    try {
      if (isNew) {
        const created = await createGraph(payload);
        navigate(`/statistics/${created.id}/edit`, { replace: true });
      } else {
        const updated = await updateGraph(Number(id), payload);
        setForm(graphToForm(updated));
      }
    } catch {
      setError("Couldn't save this graph.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-muted">Loading…</p>;
  }

  return (
    <div className="container">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="h4 mb-0">{isNew ? "New graph" : "Edit graph"}</h1>
        <Link to="/statistics" className="btn btn-sm btn-outline-secondary">
          Back to statistics
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card mb-4">
          <div className="card-body">
            <h2 className="h6 mb-3">Details</h2>

            <div className="mb-3">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={2}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Graph type</label>
                <select
                  className="form-select"
                  value={form.graph_type}
                  onChange={(e) =>
                    updateField("graph_type", e.target.value as GraphTypeEnum)
                  }
                >
                  {GRAPH_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 d-flex align-items-end">
                <div className="form-check">
                  <input
                    type="checkbox"
                    id="is_favorite"
                    className="form-check-input"
                    checked={form.is_favorite}
                    onChange={(e) =>
                      updateField("is_favorite", e.target.checked)
                    }
                  />
                  <label className="form-check-label" htmlFor="is_favorite">
                    Mark as favorite
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <h2 className="h6 mb-3">Date range</h2>

            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Period</label>
                <select
                  className="form-select"
                  value={form.period_unit}
                  onChange={(e) =>
                    updateField("period_unit", e.target.value as PeriodUnitEnum)
                  }
                >
                  {PERIOD_UNIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {form.period_unit !== "all" && (
                <div className="col-md-2">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    min={1}
                    className="form-control"
                    value={form.period_amount}
                    onChange={(e) =>
                      updateField("period_amount", Number(e.target.value))
                    }
                  />
                </div>
              )}

              <div className="col-md-3">
                <label className="form-label">Ends</label>
                <select
                  className="form-select"
                  value={form.period_end_mode}
                  onChange={(e) =>
                    updateField(
                      "period_end_mode",
                      e.target.value as PeriodEndModeEnum,
                    )
                  }
                >
                  {PERIOD_END_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {form.period_end_mode === "custom" && (
                <div className="col-md-3">
                  <label className="form-label">End date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.period_end_date}
                    onChange={(e) =>
                      updateField("period_end_date", e.target.value)
                    }
                  />
                </div>
              )}

              <div className="col-md-3">
                <label className="form-label">Range type</label>
                <select
                  className="form-select"
                  value={form.range_type}
                  onChange={(e) =>
                    updateField("range_type", e.target.value as RangeTypeEnum)
                  }
                >
                  {RANGE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-danger">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save graph"}
        </button>
      </form>

      <div className="card mt-4">
        <div className="card-body">
          <h2 className="h6 mb-3">Lines</h2>

          {isNew ? (
            <p className="text-muted small mb-0">
              Save this graph first, then you can add lines to it.
            </p>
          ) : (
            <>
              {lines.map((line) => (
                <GraphLineFormRow
                  key={line.id}
                  graphId={Number(id)}
                  bodyMetrics={bodyMetrics}
                  line={line}
                  onSaved={(saved) =>
                    setLines((prev) =>
                      prev.map((l) => (l.id === saved.id ? saved : l)),
                    )
                  }
                  onDeleted={(lineId) =>
                    setLines((prev) => prev.filter((l) => l.id !== lineId))
                  }
                />
              ))}

              {addingLine && (
                <GraphLineFormRow
                  graphId={Number(id)}
                  bodyMetrics={bodyMetrics}
                  onSaved={(saved) => {
                    setLines((prev) => [...prev, saved]);
                    setAddingLine(false);
                  }}
                  onDeleted={() => setAddingLine(false)}
                  onCancelNew={() => setAddingLine(false)}
                />
              )}

              {!addingLine && (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setAddingLine(true)}
                >
                  + Add line
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
