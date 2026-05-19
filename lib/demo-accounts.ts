function normalizeBoolean(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return null;
}

export function areDemoAccountsEnabled() {
  const configuredValue = normalizeBoolean(process.env.ENABLE_DEMO_ACCOUNTS);

  if (configuredValue !== null) {
    return configuredValue;
  }

  return process.env.NODE_ENV !== "production";
}
