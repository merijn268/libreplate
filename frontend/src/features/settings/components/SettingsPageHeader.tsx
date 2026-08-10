import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "react-bootstrap-icons";

interface SettingsPageHeaderProps {
  title: string;
  /** Where the back button goes; defaults to the settings root */
  backTo?: string;
}

export default function SettingsPageHeader({
  title,
  backTo = "/settings",
}: SettingsPageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="d-flex align-items-center gap-2 mb-4">
      <button
        type="button"
        onClick={() => navigate(backTo)}
        aria-label="Back"
        className="btn border-0 rounded-circle d-flex align-items-center justify-content-center p-2 bg-body-secondary text-body"
        style={{ width: "2.5rem", height: "2.5rem" }}
      >
        <ArrowLeft size={18} />
      </button>
      <h1 className="h4 fw-semibold mb-0">{title}</h1>
    </div>
  );
}
