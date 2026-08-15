// src/features/settings/components/ThemeSync.tsx

import { usePreferences } from "@/features/settings/hooks/usePreferences";
import { useApplyTheme } from "@/features/settings/hooks/useApplyTheme";

/**
 * Applies the user's saved dark mode / accent color as soon as
 * preferences load, and again instantly whenever they're changed
 * anywhere in the app.
 */
export function ThemeSync() {
  const { preferences } = usePreferences();

  useApplyTheme(preferences);

  return null;
}
