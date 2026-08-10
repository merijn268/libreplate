import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  accountsPreferencesPartialUpdate,
  accountsPreferencesRetrieve,
} from "@/api/generated/sdk.gen";
import type { UserPreferences } from "@/api/generated/types.gen";

export const PREFERENCES_QUERY_KEY = ["preferences"] as const;

interface UsePreferencesResult {
  preferences: UserPreferences | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  updatePreferences: (
    patch: Partial<UserPreferences>,
  ) => Promise<UserPreferences>;
}

/**
 * Reads and writes preferences through the shared React Query cache
 * under PREFERENCES_QUERY_KEY.
 *
 * Because every caller reads from the same React Query cache entry,
 * updates made from the Appearance page are immediately reflected
 * everywhere else, including the app-wide ThemeSync component.
 */
export function usePreferences(): UsePreferencesResult {
  const queryClient = useQueryClient();

  const {
    data: preferences,
    isLoading: loading,
    error: loadError,
  } = useQuery({
    queryKey: PREFERENCES_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await accountsPreferencesRetrieve();

      if (error || !data) {
        throw new Error("Couldn't load your preferences.");
      }

      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (patch: Partial<UserPreferences>) => {
      const { data, error } = await accountsPreferencesPartialUpdate({
        body: patch,
      });

      if (error || !data) {
        throw new Error("Couldn't save your changes. Please try again.");
      }

      return data;
    },

    onMutate: async (patch) => {
      await queryClient.cancelQueries({
        queryKey: PREFERENCES_QUERY_KEY,
      });

      const previous = queryClient.getQueryData<UserPreferences>(
        PREFERENCES_QUERY_KEY,
      );

      queryClient.setQueryData<UserPreferences | undefined>(
        PREFERENCES_QUERY_KEY,
        (current) => (current ? { ...current, ...patch } : current),
      );

      return { previous };
    },

    onError: (_error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PREFERENCES_QUERY_KEY, context.previous);
      }
    },

    onSuccess: (data) => {
      queryClient.setQueryData(PREFERENCES_QUERY_KEY, data);
    },
  });

  return {
    preferences: preferences ?? null,
    loading,
    saving: mutation.isPending,
    error:
      loadError instanceof Error
        ? loadError.message
        : mutation.error instanceof Error
          ? mutation.error.message
          : null,
    updatePreferences: async (patch) => {
      return mutation.mutateAsync(patch);
    },
  };
}
