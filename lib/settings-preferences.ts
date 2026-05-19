export type SettingsTheme = "dark" | "sunset";
export type SettingsLanguage = "en" | "mn";
export type StoredPaymentMethod = "CASH" | "CARD" | "QPAY";

export type SavedAddress = {
  apartmentUnit: string | null;
  details: string;
  district: string | null;
  id: string;
  isDefault: boolean;
  khoroo: string | null;
  label: string;
  latitude: number | null;
  longitude: number | null;
};

export type UserSettingsPreferences = {
  notificationsEnabled: boolean;
  preferredPaymentMethod: StoredPaymentMethod;
  savedAddresses: SavedAddress[];
};

export type InterfaceSettingsPreferences = {
  language: SettingsLanguage;
  theme: SettingsTheme;
};

const USER_SETTINGS_KEY_PREFIX = "burgernaut:user-settings";
const INTERFACE_SETTINGS_KEY = "burgernaut:interface-settings";
const PAYMENT_METHOD_VALUES = ["CASH", "CARD", "QPAY"] as const;
export const INTERFACE_SETTINGS_UPDATED_EVENT = "burgernaut:interface-settings-updated";

export const DEFAULT_USER_SETTINGS: UserSettingsPreferences = {
  notificationsEnabled: true,
  preferredPaymentMethod: "QPAY",
  savedAddresses: [],
};

export const DEFAULT_INTERFACE_SETTINGS: InterfaceSettingsPreferences = {
  language: "en",
  theme: "dark",
};

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeNullableText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeCoordinate(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function createStorageKey(userId: string) {
  return `${USER_SETTINGS_KEY_PREFIX}:${userId}`;
}

function readStorage<T>(key: string): T | null {
  if (!canUseBrowserStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown) {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore local storage write failures so the app remains usable.
  }
}

export function createAddressId() {
  return `address-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ensureSingleDefaultSavedAddresses(addresses: SavedAddress[]) {
  const normalizedAddresses = addresses.map((address) => ({
    apartmentUnit: normalizeNullableText(address.apartmentUnit),
    details: address.details.trim(),
    district: normalizeNullableText(address.district),
    id: address.id.trim() || createAddressId(),
    isDefault: address.isDefault === true,
    khoroo: normalizeNullableText(address.khoroo),
    label: address.label.trim(),
    latitude: normalizeCoordinate(address.latitude),
    longitude: normalizeCoordinate(address.longitude),
  })).filter((address) => address.label && address.details);

  const defaultAddress = normalizedAddresses.find((address) => address.isDefault);

  if (defaultAddress) {
    return normalizedAddresses.map((address) => ({
      ...address,
      isDefault: address.id === defaultAddress.id,
    }));
  }

  if (normalizedAddresses.length === 0) {
    return [];
  }

  return normalizedAddresses.map((address, index) => ({
    ...address,
    isDefault: index === 0,
  }));
}

export function isStoredPaymentMethod(value: unknown): value is StoredPaymentMethod {
  return PAYMENT_METHOD_VALUES.includes(value as StoredPaymentMethod);
}

export function normalizeSavedAddresses(value: unknown): SavedAddress[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return ensureSingleDefaultSavedAddresses(
    value
      .filter(isRecord)
      .map((address) => ({
        apartmentUnit: normalizeNullableText(address.apartmentUnit),
        details: typeof address.details === "string" ? address.details.trim() : "",
        district: normalizeNullableText(address.district),
        id:
          typeof address.id === "string" && address.id.trim()
            ? address.id.trim()
            : createAddressId(),
        isDefault: address.isDefault === true,
        khoroo: normalizeNullableText(address.khoroo),
        label: typeof address.label === "string" ? address.label.trim() : "",
        latitude: normalizeCoordinate(address.latitude),
        longitude: normalizeCoordinate(address.longitude),
      }))
  );
}

export function normalizeUserSettings(value: unknown): UserSettingsPreferences {
  if (!isRecord(value)) {
    return DEFAULT_USER_SETTINGS;
  }

  return {
    notificationsEnabled:
      typeof value.notificationsEnabled === "boolean"
        ? value.notificationsEnabled
        : DEFAULT_USER_SETTINGS.notificationsEnabled,
    preferredPaymentMethod: isStoredPaymentMethod(value.preferredPaymentMethod)
      ? value.preferredPaymentMethod
      : DEFAULT_USER_SETTINGS.preferredPaymentMethod,
    savedAddresses: normalizeSavedAddresses(value.savedAddresses),
  };
}

function normalizeInterfaceSettings(value: unknown): InterfaceSettingsPreferences {
  if (!isRecord(value)) {
    return DEFAULT_INTERFACE_SETTINGS;
  }

  return {
    language: value.language === "mn" ? "mn" : DEFAULT_INTERFACE_SETTINGS.language,
    theme: value.theme === "sunset" ? "sunset" : DEFAULT_INTERFACE_SETTINGS.theme,
  };
}

export function loadUserSettings(userId?: string | null) {
  if (!userId) {
    return DEFAULT_USER_SETTINGS;
  }

  return normalizeUserSettings(readStorage(createStorageKey(userId)));
}

export function saveUserSettings(userId: string, value: UserSettingsPreferences) {
  writeStorage(createStorageKey(userId), normalizeUserSettings(value));
}

export function loadInterfaceSettings() {
  return normalizeInterfaceSettings(readStorage(INTERFACE_SETTINGS_KEY));
}

export function saveInterfaceSettings(value: InterfaceSettingsPreferences) {
  writeStorage(INTERFACE_SETTINGS_KEY, normalizeInterfaceSettings(value));
}

export function setInterfaceSettings(value: InterfaceSettingsPreferences) {
  const normalized = normalizeInterfaceSettings(value);

  saveInterfaceSettings(normalized);
  applyInterfaceSettings(normalized);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(INTERFACE_SETTINGS_UPDATED_EVENT, {
        detail: normalized,
      })
    );
  }

  return normalized;
}

export function applyInterfaceSettings(value: InterfaceSettingsPreferences) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = value.theme;
  document.documentElement.lang = value.language;
}

export function getLanguageLabel(value: SettingsLanguage) {
  return value === "mn" ? "Mongolian" : "English";
}

export function getThemeLabel(value: SettingsTheme) {
  return value === "sunset" ? "Sunset" : "Dark";
}

export function getDefaultSavedAddress(settings: UserSettingsPreferences) {
  return settings.savedAddresses.find((address) => address.isDefault)
    ?? settings.savedAddresses[0]
    ?? null;
}
