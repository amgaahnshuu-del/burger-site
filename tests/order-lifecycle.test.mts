import assert from "node:assert/strict";
import test from "node:test";

import {
  canCustomerCancelOrder,
  extractCoordinatesFromAddress,
  resolvePaymentWebhookStatus,
} from "../lib/order-lifecycle.ts";

test("extractCoordinatesFromAddress parses current-location payloads", () => {
  assert.deepEqual(
    extractCoordinatesFromAddress("Current location (47.91853, 106.91770)"),
    {
      latitude: 47.91853,
      longitude: 106.9177,
    }
  );
  assert.equal(extractCoordinatesFromAddress("Sukhbaatar district"), null);
});

test("canCustomerCancelOrder blocks courier and delivered states", () => {
  assert.equal(canCustomerCancelOrder("PENDING", "PENDING"), true);
  assert.equal(canCustomerCancelOrder("COOKING", "PAID"), true);
  assert.equal(canCustomerCancelOrder("DELIVERING", "PAID"), false);
  assert.equal(canCustomerCancelOrder("DELIVERED", "PAID"), false);
});

test("resolvePaymentWebhookStatus maps payment provider events", () => {
  assert.deepEqual(resolvePaymentWebhookStatus("PENDING", "payment.succeeded"), {
    cancelOrder: false,
    nextStatus: "PAID",
  });
  assert.deepEqual(resolvePaymentWebhookStatus("PAID", "payment.refunded"), {
    cancelOrder: true,
    nextStatus: "REFUNDED",
  });
  assert.equal(resolvePaymentWebhookStatus("REFUNDED", "payment.succeeded"), null);
});
