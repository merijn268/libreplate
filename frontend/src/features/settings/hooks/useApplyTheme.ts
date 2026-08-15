import { useEffect } from "react";

import type { UserPreferences } from "@/api/generated/types.gen";

import { DEFAULT_THEME_COLOR } from "../themeColors";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/**
 * Applies the user's saved appearance preferences to <html>.
 *
 * Dark/light mode is handled by Bootstrap's native data-bs-theme mechanism.
 *
 * The user's accent color is applied to our application-level
 * --app-primary variable. Bootstrap consumes that variable through
 * --bs-primary in the theme stylesheet.
 */
export function useApplyTheme(preferences: UserPreferences | null | undefined) {
  useEffect(() => {
    const root = document.documentElement;

    // -----------------------------------------------------------------------
    // Dark mode
    // -----------------------------------------------------------------------

    root.setAttribute(
      "data-bs-theme",
      preferences?.dark_mode ? "dark" : "light",
    );

    // -----------------------------------------------------------------------
    // Accent color
    // -----------------------------------------------------------------------

    const themeColor = (
      preferences?.theme_color ?? DEFAULT_THEME_COLOR
    ).toLowerCase();

    if (!HEX_COLOR.test(themeColor)) {
      return;
    }

    root.style.setProperty("--app-primary", themeColor);

    root.style.setProperty("--bs-primary-rgb", hexToRgb(themeColor));
  }, [preferences?.dark_mode, preferences?.theme_color]);
}

function hexToRgb(hex: string): string {
  const value = parseInt(hex.replace("#", ""), 16);

  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  return `${r}, ${g}, ${b}`;
}
