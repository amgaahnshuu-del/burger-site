export type AdminSection = "foods" | "most-sell" | "users" | "couriers" | "add-food";

export const ADMIN_SECTION_EVENT = "admin-section-change";
export const DEFAULT_ADMIN_SECTION: AdminSection = "most-sell";

const ADMIN_SECTIONS = new Set<AdminSection>([
  "foods",
  "most-sell",
  "users",
  "couriers",
  "add-food",
]);

export function normalizeAdminSection(value?: string | null): AdminSection {
  if (value && ADMIN_SECTIONS.has(value as AdminSection)) {
    return value as AdminSection;
  }

  return DEFAULT_ADMIN_SECTION;
}

export function getAdminSectionFromSearch(search: string): AdminSection {
  return normalizeAdminSection(new URLSearchParams(search).get("section"));
}

export function dispatchAdminSectionChange(section: AdminSection) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<AdminSection>(ADMIN_SECTION_EVENT, {
    detail: section,
  }));
}
