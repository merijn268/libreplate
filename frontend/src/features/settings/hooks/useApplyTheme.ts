import { useEffect } from "react";

import type { UserPreferences } from "@/api/generated/types.gen";

import { DEFAULT_THEME_COLOR } from "../themeColors";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/**
 * Applies the user's saved preferences to <html>: Bootstrap's native dark
 * mode via data-bs-theme, and the chosen accent color (stored as a hex
 * string, e.g. "#3b82f6") by overriding the --bs-primary custom property
 * Bootstrap already uses for that role.
 *
 * Call this once, high in the tree - e.g. in AppLayout:
 *
 *   const { preferences } = usePreferences();
 *   useApplyTheme(preferences);
 */
export function useApplyTheme(preferences: UserPreferences | null | undefined) {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute(
      "data-bs-theme",
      preferences?.dark_mode ? "dark" : "light",
    );

    const themeColor = preferences?.theme_color ?? DEFAULT_THEME_COLOR;

    if (HEX_COLOR.test(themeColor)) {
      root.style.setProperty("--bs-primary", themeColor);
      root.style.setProperty("--bs-primary-rgb", hexToRgb(themeColor));
    }
  }, [preferences?.dark_mode, preferences?.theme_color]);
}

function hexToRgb(hex: string): string {
  const value = parseInt(hex.replace("#", ""), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `${r}, ${g}, ${b}`;
}
