"use client";

import { useEffect, useState } from "react";

import {
  DEFAULT_INTERFACE_SETTINGS,
  INTERFACE_SETTINGS_UPDATED_EVENT,
  loadInterfaceSettings,
  setInterfaceSettings,
  type InterfaceSettingsPreferences,
} from "@/lib/settings-preferences";

export function useInterfaceSettings() {
  const [settings, setSettingsState] = useState<InterfaceSettingsPreferences>(
    DEFAULT_INTERFACE_SETTINGS
  );

  useEffect(() => {
    const syncSettings = () => {
      setSettingsState(loadInterfaceSettings());
    };

    const handleUpdated = (event: Event) => {
      const nextSettings = (event as CustomEvent<InterfaceSettingsPreferences>).detail;
      setSettingsState(nextSettings ?? loadInterfaceSettings());
    };

    syncSettings();

    window.addEventListener("storage", syncSettings);
    window.addEventListener(
      INTERFACE_SETTINGS_UPDATED_EVENT,
      handleUpdated as EventListener
    );

    return () => {
      window.removeEventListener("storage", syncSettings);
      window.removeEventListener(
        INTERFACE_SETTINGS_UPDATED_EVENT,
        handleUpdated as EventListener
      );
    };
  }, []);

  function updateSettings(nextSettings: InterfaceSettingsPreferences) {
    const normalized = setInterfaceSettings(nextSettings);
    setSettingsState(normalized);
    return normalized;
  }

  return {
    settings,
    updateSettings,
  };
}
