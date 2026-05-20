import type { Metadata } from "next";

import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      description="This policy explains what customer, courier, and account data Burger stores to operate ordering, dispatch, payments, and support."
      sections={[
        {
          body: "We collect account details such as your name, email address, phone number, and saved delivery preferences so we can authenticate your account and complete deliveries.",
          title: "Information we collect",
        },
        {
          body: "Order history, delivery addresses, payment references, and courier tracking updates are used to route orders, answer support requests, and improve kitchen and delivery operations.",
          title: "How we use your information",
        },
        {
          body: "We only share the minimum required order information with couriers, payment providers, email providers, and infrastructure vendors that help us run the service.",
          title: "When we share information",
        },
        {
          body: "You can update account details and saved addresses from the settings page. If you need account deletion or a data export, contact support at support@burger.mn.",
          title: "Your choices",
        },
      ]}
      title="Privacy Policy"
    />
  );
}
