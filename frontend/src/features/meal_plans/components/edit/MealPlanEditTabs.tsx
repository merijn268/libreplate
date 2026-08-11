type EditTab = "details" | "meals-foods";

type MealPlanEditTabsProps = {
  activeTab: EditTab;
  onTabChange: (tab: EditTab) => void;
};

export default function MealPlanEditTabs({
  activeTab,
  onTabChange,
}: MealPlanEditTabsProps) {
  return (
    <div className="mb-3">
      <div
        className="d-flex"
        style={{
          borderBottom: "1px solid var(--bs-border-color)",
        }}
      >
        <button
          type="button"
          onClick={() => onTabChange("details")}
          className="btn border-0 rounded-0 shadow-none px-3 py-2"
          style={{
            position: "relative",
            color:
              activeTab === "details"
                ? "var(--bs-body-color)"
                : "var(--bs-secondary-color)",
            fontWeight: activeTab === "details" ? 600 : 400,
          }}
        >
          Setup
          {activeTab === "details" && (
            <span
              style={{
                position: "absolute",
                bottom: "-1px",
                left: 0,
                right: 0,
                height: "2px",
                backgroundColor: "var(--bs-primary)",
                borderRadius: "2px 2px 0 0",
              }}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange("meals-foods")}
          className="btn border-0 rounded-0 shadow-none px-3"
          style={{
            position: "relative",
            color:
              activeTab === "meals-foods"
                ? "var(--bs-body-color)"
                : "var(--bs-secondary-color)",
            fontWeight: activeTab === "meals-foods" ? 600 : 400,
          }}
        >
          Plan
          {activeTab === "meals-foods" && (
            <span
              style={{
                position: "absolute",
                bottom: "-1px",
                left: 0,
                right: 0,
                height: "2px",
                backgroundColor: "var(--bs-primary)",
                borderRadius: "2px 2px 0 0",
              }}
            />
          )}
        </button>
      </div>
    </div>
  );
}
