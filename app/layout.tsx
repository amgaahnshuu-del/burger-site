import type { Metadata } from "next";
import { Inter } from "next/font/google";

import AppShell from "@/components/layout/AppShell";
import { APP_NAME } from "@/lib/constants";
import { APP_DESCRIPTION, getSiteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  metadataBase: getSiteUrl(),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [
      {
        alt: `${APP_NAME} logo`,
        url: "/logo.png",
      },
    ],
    locale: "en_US",
    siteName: APP_NAME,
    type: "website",
    url: "/",
  },
  robots: {
    follow: true,
    index: true,
  },
  twitter: {
    card: "summary_large_image",
    description: APP_DESCRIPTION,
    images: ["/logo.png"],
    title: APP_NAME,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-[var(--bg-app)] text-[var(--text-primary)]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
