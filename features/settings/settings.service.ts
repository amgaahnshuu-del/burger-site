import type { UserSettingsPreferences } from "@/lib/settings-preferences";
import { fetchJson } from "@/lib/fetcher";

export function getUserSettings() {
  return fetchJson<UserSettingsPreferences>("/api/user/settings");
}

export function updateUserSettings(payload: UserSettingsPreferences) {
  return fetchJson<UserSettingsPreferences>("/api/user/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
