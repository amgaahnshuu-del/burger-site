import assert from "node:assert/strict";
import test from "node:test";

import {
  ensureSingleDefaultSavedAddresses,
  normalizeUserSettings,
} from "../lib/settings-preferences.ts";

test("normalizeUserSettings keeps only supported payment methods", () => {
  const normalized = normalizeUserSettings({
    notificationsEnabled: false,
    preferredPaymentMethod: "CRYPTO",
    savedAddresses: [],
  });

  assert.equal(normalized.notificationsEnabled, false);
  assert.equal(normalized.preferredPaymentMethod, "QPAY");
});

test("ensureSingleDefaultSavedAddresses keeps exactly one default address", () => {
  const addresses = ensureSingleDefaultSavedAddresses([
    {
      apartmentUnit: null,
      details: "Sukhbaatar district",
      district: "Sukhbaatar",
      id: "one",
      isDefault: true,
      khoroo: null,
      label: "Home",
      latitude: null,
      longitude: null,
    },
    {
      apartmentUnit: null,
      details: "Bayanzurkh district",
      district: "Bayanzurkh",
      id: "two",
      isDefault: true,
      khoroo: null,
      label: "Office",
      latitude: null,
      longitude: null,
    },
  ]);

  assert.equal(addresses.length, 2);
  assert.equal(addresses.filter((address) => address.isDefault).length, 1);
  assert.equal(addresses[0].isDefault, true);
  assert.equal(addresses[1].isDefault, false);
});
