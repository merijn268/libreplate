import { usePreferences } from "@/features/settings/hooks/usePreferences";
import { useApplyTheme } from "@/features/settings/hooks/useApplyTheme";

/**
 * Applies the user's saved dark mode / accent color as soon as
 * preferences load, and again instantly whenever they're changed
 * anywhere in the app.
 *
 * The component reads from the shared React Query cache through
 * usePreferences(), so changes made by the Appearance settings page
 * are automatically reflected here.
 */
export function ThemeSync() {
  const { preferences } = usePreferences();

  useApplyTheme(preferences);

  return null;
}
