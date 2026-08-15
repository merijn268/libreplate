import { CheckLg, MoonStarsFill } from "react-bootstrap-icons";

import SettingsPageHeader from "./components/SettingsPageHeader";
import { usePreferences } from "./hooks/usePreferences";
import { DEFAULT_THEME_COLOR, THEME_COLORS } from "./themeColors";

export default function AppearanceSettingsPage() {
  const { preferences, loading, error, updatePreferences } = usePreferences();

  const darkMode = preferences?.dark_mode ?? false;

  const themeColor = (
    preferences?.theme_color ?? DEFAULT_THEME_COLOR
  ).toLowerCase();

  const selectedLabel =
    THEME_COLORS.find((option) => option.hex.toLowerCase() === themeColor)
      ?.label ?? "Custom";

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <SettingsPageHeader title="Appearance" />

          {error && (
            <div className="alert alert-danger py-2 small" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading…</span>
              </div>
            </div>
          ) : (
            <>
              {/* =========================================================
                  Theme
                  ========================================================= */}

              <div className="mb-4">
                <div className="text-uppercase text-body-secondary small fw-semibold mb-2 px-1">
                  Theme
                </div>

                <div className="card app-surface">
                  <div className="list-group list-group-flush">
                    <div className="list-group-item app-surface d-flex align-items-center gap-3 py-3">
                      <MoonStarsFill
                        className="flex-shrink-0 text-body-secondary"
                        size={20}
                      />

                      <div className="flex-grow-1">
                        <div className="fw-medium">Dark mode</div>

                        <div className="text-body-secondary small">
                          Use a dark color scheme
                        </div>
                      </div>

                      <div className="form-check form-switch m-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="dark-mode-switch"
                          checked={darkMode}
                          onChange={(event) =>
                            updatePreferences({
                              dark_mode: event.target.checked,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-uppercase text-body-secondary small fw-semibold mb-2 px-1">
                  Accent color
                </div>

                <div className="card app-surface">
                  <div className="card-body">
                    <div
                      className="d-flex flex-wrap gap-3"
                      role="radiogroup"
                      aria-label="Accent color"
                    >
                      {THEME_COLORS.map((option) => {
                        const selected =
                          themeColor === option.hex.toLowerCase();

                        return (
                          <button
                            key={option.hex}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            aria-label={option.label}
                            onClick={() =>
                              updatePreferences({
                                theme_color: option.hex,
                              })
                            }
                            className={`btn p-0 rounded-circle position-relative border border-2 ${
                              selected
                                ? "app-border-strong shadow-sm"
                                : "app-border"
                            }`}
                            style={{
                              width: "2.5rem",
                              height: "2.5rem",
                              backgroundColor: option.hex,
                            }}
                          >
                            {selected && (
                              <CheckLg
                                className="position-absolute top-50 start-50 translate-middle text-white"
                                size={18}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-body-secondary small mt-3">
                      {selectedLabel}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
