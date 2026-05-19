"use client";

import { useEffect, useState } from "react";

import { getUserSettings, updateUserSettings } from "@/features/settings/settings.service";
import { ApiError } from "@/lib/fetcher";
import { getErrorMessage } from "@/lib/helpers";
import {
  DEFAULT_USER_SETTINGS,
  loadUserSettings,
  normalizeUserSettings,
  saveUserSettings,
  type UserSettingsPreferences,
} from "@/lib/settings-preferences";

export function useUserSettings(userId?: string | null, enabled = true) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(enabled && userId));
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettingsPreferences>(() =>
    userId ? loadUserSettings(userId) : DEFAULT_USER_SETTINGS
  );

  useEffect(() => {
    if (!userId) {
      setSettings(DEFAULT_USER_SETTINGS);
      setError(null);
      setIsLoading(false);
      return;
    }

    setSettings(loadUserSettings(userId));
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      if (!enabled || !userId) {
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const nextSettings = normalizeUserSettings(await getUserSettings());

        if (cancelled) {
          return;
        }

        setSettings(nextSettings);
        saveUserSettings(userId, nextSettings);
        setError(null);
      } catch (settingsError) {
        if (cancelled) {
          return;
        }

        if (settingsError instanceof ApiError && settingsError.status === 401) {
          setSettings(DEFAULT_USER_SETTINGS);
          setError(null);
        } else {
          setError(getErrorMessage(settingsError));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [enabled, userId]);

  async function persistSettings(nextSettings: UserSettingsPreferences) {
    if (!userId) {
      return DEFAULT_USER_SETTINGS;
    }

    const normalized = normalizeUserSettings(nextSettings);
    const previousSettings = settings;
    setSettings(normalized);
    saveUserSettings(userId, normalized);
    setIsSaving(true);

    try {
      const persistedSettings = normalizeUserSettings(await updateUserSettings(normalized));
      setSettings(persistedSettings);
      saveUserSettings(userId, persistedSettings);
      setError(null);
      return persistedSettings;
    } catch (settingsError) {
      setSettings(previousSettings);
      saveUserSettings(userId, previousSettings);
      setError(getErrorMessage(settingsError));
      throw settingsError;
    } finally {
      setIsSaving(false);
    }
  }

  async function refresh() {
    if (!enabled || !userId) {
      setSettings(DEFAULT_USER_SETTINGS);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const nextSettings = normalizeUserSettings(await getUserSettings());
      setSettings(nextSettings);
      saveUserSettings(userId, nextSettings);
      setError(null);
    } catch (settingsError) {
      setError(getErrorMessage(settingsError));
    } finally {
      setIsLoading(false);
    }
  }

  return {
    error,
    isLoading,
    isSaving,
    refresh,
    saveSettings: persistSettings,
    settings,
  };
}
