import type { ReactNode } from "react";
import { PersonCircle, Palette } from "react-bootstrap-icons";

import SettingsListItem from "./components/SettingsListItem";

export default function SettingsPage() {
  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <h1 className="h4 fw-semibold mb-4">Settings</h1>

          <SettingsSection title="Display">
            <SettingsListItem
              icon={Palette}
              label="Appearance"
              description="Dark mode, accent color"
              to="/settings/appearance"
            />
          </SettingsSection>

          <SettingsSection title="Account" className="mt-4">
            <SettingsListItem
              icon={PersonCircle}
              label="Account"
              description="Profile and login"
              to="/account"
            />
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
