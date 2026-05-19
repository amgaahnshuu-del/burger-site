import type { Metadata } from "next";

import LegalPage from "@/components/legal/LegalPage";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <LegalPage
      description={`Need help with an order, a courier handoff, billing, or account access? These are the primary support channels for ${APP_NAME}.`}
      sections={[
        {
          body: "Email the team at support@burger.mn for account help, delivery issues, refunds, or data requests. Include your order number when possible.",
          title: "Email support",
        },
        {
          body: "Call +976 7711 2233 for urgent delivery issues that require the dispatch team while the order is still active.",
          title: "Phone support",
        },
        {
          body: "Use the in-app messages and feedback tools for product suggestions, bug reports, and non-urgent assistance.",
          title: "In-app support",
        },
        {
          body: "Operating city: Ulaanbaatar, Mongolia. Delivery availability depends on the active service radius and courier capacity.",
          title: "Service coverage",
        },
      ]}
      title={`Contact ${APP_NAME}`}
    />
  );
}
