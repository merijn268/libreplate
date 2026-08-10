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
    <ul className="nav nav-tabs mb-4">
      <li className="nav-item">
        <button
          type="button"
          className={`nav-link ${activeTab === "details" ? "active" : ""}`}
          onClick={() => onTabChange("details")}
        >
          Details
        </button>
      </li>

      <li className="nav-item">
        <button
          type="button"
          className={`nav-link ${activeTab === "meals-foods" ? "active" : ""}`}
          onClick={() => onTabChange("meals-foods")}
        >
          Meal Plan
        </button>
      </li>
    </ul>
  );
}
