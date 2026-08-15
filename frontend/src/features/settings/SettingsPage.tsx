import type { ReactNode } from "react";
import {
  Book,
  Cake2,
  Calendar3,
  Cart4,
  ClipboardData,
  Easel,
  Globe,
  GraphDown,
  JournalText,
  Palette,
  PersonCircle,
  Trophy,
} from "react-bootstrap-icons";

import SettingsListItem from "./components/SettingsListItem";

export default function SettingsPage() {
  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <SettingsSection title="General">
            <SettingsListItem
              icon={Palette}
              label="Appearance"
              to="/settings/appearance"
            />
            <SettingsListItem
              icon={Trophy}
              label="Goals"
              to="/settings/goals"
            />
            <SettingsListItem
              icon={Globe}
              label="Integrations"
              to="/settings/data"
            />
          </SettingsSection>

          <SettingsSection title="Pages" className="mt-2">
            <SettingsListItem
              icon={JournalText}
              label="Diary"
              to="/settings/diary"
            />
            <SettingsListItem
              icon={Book}
              label="Recipes"
              to="/settings/recipes"
            />
            <SettingsListItem icon={Cake2} label="Foods" to="/settings/foods" />
            <SettingsListItem
              icon={Cart4}
              label="Groceries"
              to="/settings/groceries"
            />
            <SettingsListItem
              icon={GraphDown}
              label="Statistics"
              to="/settings/statitics"
            />
            <SettingsListItem
              icon={Calendar3}
              label="Meal Plans"
              to="/settings/meal_plans"
            />
          </SettingsSection>

          <SettingsSection title="Account" className="mt-2">
            <SettingsListItem
              icon={PersonCircle}
              label="Account"
              to="/account"
            />
            <SettingsListItem
              icon={ClipboardData}
              label="Import/Export"
              to="/account"
            />
          </SettingsSection>

          {/* TODO Should be a github release commit hash in the about! */}
          <SettingsSection title="LibrePlate" className="mt-2">
            <SettingsListItem icon={Easel} label="About" to="/settings/about" />
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}

function SettingsSection({
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
        <div className="list-group list-group-flush">{children}</div>
      </div>
    </div>
  );
}
