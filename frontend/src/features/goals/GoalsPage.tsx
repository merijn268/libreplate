import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  goalsGoalPlansCreate,
  goalsGoalPlansList,
  goalsGoalPlansPartialUpdate,
  bodyMetricsBodyMetricsList,
  nutrientsList,
} from "@/api/generated";
import type {
  BodyMetric,
  GoalBodyMetricWritable,
  GoalNutrientWritable,
  GoalPlan,
  GoalPlanWritable,
  Nutrient,
} from "@/api/generated";

const DEFAULT_PLAN_NAME = "My Goals";

// Used to pick the "Calories" nutrient out of the goal-editable nutrient
// list so it gets its own prominent section instead of being lumped in
// with macro/micronutrients.
const ENERGY_NUTRIENT_NAMES = ["energy", "calories", "kcal"];

type AmountsById = Record<number, string>;

export default function GoalsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [goalPlan, setGoalPlan] = useState<GoalPlan | null>(null);
  const [nutrients, setNutrients] = useState<Nutrient[]>([]);
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([]);

  const [nutrientAmounts, setNutrientAmounts] = useState<AmountsById>({});
  const [bodyMetricAmounts, setBodyMetricAmounts] = useState<AmountsById>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);

      try {
        const [plansRes, nutrientsRes, bodyMetricsRes] = await Promise.all([
          goalsGoalPlansList({}),
          nutrientsList(),
          // TODO: drop this cast once the backend fix below lands and the
          // SDK is regenerated — bodyMetricsBodyMetricsList's generated
          // type currently (incorrectly) requires a `path.id` on the list
          // endpoint. The call itself doesn't use `path` at runtime.
          bodyMetricsBodyMetricsList({} as never),
        ]);

        if (cancelled) return;

        if (plansRes.error || nutrientsRes.error || bodyMetricsRes.error) {
          throw new Error("Failed to load goals.");
        }

        // Backend supports multiple goal plans; the UI only ever edits one,
        // so we take the first plan the user has (if any).
        const plan = plansRes.data?.[0] ?? null;

        const visibleNutrients = (nutrientsRes.data ?? []).filter(
          (n) => n.show_in_goal_edit,
        );
        const visibleBodyMetrics = (bodyMetricsRes.data ?? []).filter(
          (b) => b.visibility?.show_in_goal_edit,
        );

        setGoalPlan(plan);
        setNutrients(visibleNutrients);
        setBodyMetrics(visibleBodyMetrics);

        const initialNutrientAmounts: AmountsById = {};
        for (const goal of plan?.nutrient_goals ?? []) {
          initialNutrientAmounts[goal.nutrient.id] = String(goal.amount);
        }
        setNutrientAmounts(initialNutrientAmounts);

        const initialBodyMetricAmounts: AmountsById = {};
        for (const goal of plan?.body_metric_goals ?? []) {
          initialBodyMetricAmounts[goal.body_metric.id] = String(goal.amount);
        }
        setBodyMetricAmounts(initialBodyMetricAmounts);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load goals.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const energyNutrient = useMemo(
    () =>
      nutrients.find((n) =>
        ENERGY_NUTRIENT_NAMES.includes(n.name.trim().toLowerCase()),
      ) ?? null,
    [nutrients],
  );

  const otherNutrients = useMemo(
    () => nutrients.filter((n) => n.id !== energyNutrient?.id),
    [nutrients, energyNutrient],
  );

  function handleNutrientChange(id: number, value: string) {
    setNutrientAmounts((prev) => ({ ...prev, [id]: value }));
  }

  function handleBodyMetricChange(id: number, value: string) {
    setBodyMetricAmounts((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    // Only send amounts the user actually filled in — an empty field means
    // "no target for this one", not zero.
    const nutrient_goals: GoalNutrientWritable[] = Object.entries(
      nutrientAmounts,
    )
      .filter(([, value]) => value.trim() !== "")
      .map(([id, value]) => ({
        nutrient_id: Number(id),
        amount: Number(value),
      }));

    const body_metric_goals: GoalBodyMetricWritable[] = Object.entries(
      bodyMetricAmounts,
    )
      .filter(([, value]) => value.trim() !== "")
      .map(([id, value]) => ({
        body_metric_id: Number(id),
        amount: Number(value),
      }));

    const payload: GoalPlanWritable = {
      name: goalPlan?.name ?? DEFAULT_PLAN_NAME,
      nutrient_goals,
      body_metric_goals,
    };

    try {
      const res = goalPlan
        ? await goalsGoalPlansPartialUpdate({
            path: { id: goalPlan.id },
            body: payload,
          })
        : await goalsGoalPlansCreate({ body: payload });

      if (res.error || !res.data) {
        throw new Error("Failed to save goals.");
      }

      setGoalPlan(res.data);
      setSaved(true);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save goals.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <p className="text-body-secondary">Loading goals…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container">
        <div className="alert alert-danger">{loadError}</div>
      </div>
    );
  }

  const noFieldsConfigured =
    bodyMetrics.length === 0 && !energyNutrient && otherNutrients.length === 0;

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          {bodyMetrics.length > 0 && (
            <GoalsSection title="Weight & Body Metrics" className="mb-3">
              {bodyMetrics.map((metric) => (
                <AmountField
                  key={metric.id}
                  label={metric.name}
                  value={bodyMetricAmounts[metric.id] ?? ""}
                  onChange={(value) => handleBodyMetricChange(metric.id, value)}
                />
              ))}
            </GoalsSection>
          )}

          {energyNutrient && (
            <GoalsSection title="Calories" className="mb-3">
              <AmountField
                label={energyNutrient.name}
                unit={energyNutrient.unit ?? undefined}
                value={nutrientAmounts[energyNutrient.id] ?? ""}
                onChange={(value) =>
                  handleNutrientChange(energyNutrient.id, value)
                }
              />
            </GoalsSection>
          )}

          {otherNutrients.length > 0 && (
            <GoalsSection title="Macro & Micronutrients" className="mb-3">
              {otherNutrients.map((nutrient) => (
                <AmountField
                  key={nutrient.id}
                  label={nutrient.name}
                  unit={nutrient.unit ?? undefined}
                  value={nutrientAmounts[nutrient.id] ?? ""}
                  onChange={(value) => handleNutrientChange(nutrient.id, value)}
                />
              ))}
            </GoalsSection>
          )}

          {noFieldsConfigured && (
            <p className="text-body-secondary">
              No goal fields are configured yet.
            </p>
          )}

          {saveError && (
            <div className="alert alert-danger" role="alert">
              {saveError}
            </div>
          )}

          {saved && !saveError && (
            <div className="alert alert-success" role="alert">
              Goals saved.
            </div>
          )}

          {!noFieldsConfigured && (
            <button
              type="button"
              className="btn btn-primary w-100"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? "Saving…" : "Save Goals"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function GoalsSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-uppercase text-body-secondary small fw-semibold mb-2 px-1">
        {title}
      </div>
      <div className="card">
        <div className="card-body d-flex flex-column gap-3">{children}</div>
      </div>
    </div>
  );
}

function AmountField({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="form-label mb-1">
        {label}
        {unit ? <span className="text-body-secondary"> ({unit})</span> : null}
      </label>
      <input
        type="number"
        inputMode="decimal"
        step="any"
        className="form-control"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
