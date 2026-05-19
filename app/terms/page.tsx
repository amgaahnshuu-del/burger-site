import type { Metadata } from "next";

import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <LegalPage
      description="These terms describe how customers, managers, couriers, and admins are expected to use Burger responsibly."
      sections={[
        {
          body: "By placing an order, you confirm that the contact details, address, and payment method you provide are accurate and authorized for use.",
          title: "Using the service",
        },
        {
          body: "Availability, delivery windows, menu items, and pricing may change without notice. Orders are only considered final once they are accepted by the system.",
          title: "Orders and pricing",
        },
        {
          body: "Courier ETAs and live tracking are best-effort features. Delays caused by weather, traffic, or access restrictions can affect delivery timing.",
          title: "Delivery expectations",
        },
        {
          body: "Accounts that abuse the service, attempt payment fraud, or interfere with delivery operations may be suspended or permanently removed.",
          title: "Account restrictions",
        },
      ]}
      title="Terms of Service"
    />
  );
}
