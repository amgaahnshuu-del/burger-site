import type { Metadata } from "next";

import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Refund Policy",
};

export default function RefundPolicyPage() {
  return (
    <LegalPage
      description="Refund outcomes depend on the payment state and the point reached in the kitchen and courier workflow."
      sections={[
        {
          body: "Orders cancelled before courier handoff are eligible for review. Pending online payments may be voided, and completed online payments may be marked as refunded.",
          title: "Before dispatch",
        },
        {
          body: "If an order has already been assigned to a courier, automatic cancellation is disabled in the app. Contact support immediately so the team can review the case.",
          title: "After courier assignment",
        },
        {
          body: "Cash-on-delivery orders are charged only when the courier completes the handoff. If the order is cancelled before delivery, no collection should occur.",
          title: "Cash payments",
        },
        {
          body: "Refund timing depends on your payment provider. If you do not see a refund after provider processing time, contact support with your order number and payment reference.",
          title: "Processing times",
        },
      ]}
      title="Refund Policy"
    />
  );
}
