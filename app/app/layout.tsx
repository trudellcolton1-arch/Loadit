import type { Metadata, Viewport } from "next";
import { RegisterSw } from "./_components/RegisterSw";

export const metadata: Metadata = {
  title: "Loadit — wallet",
  description: "Load cash into USDC you control, and cash out again, at a licensed cash network. Non-custodial.",
  manifest: "/app/manifest.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Loadit" },
  icons: { apple: "/apple-icon.png" },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#04060B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-void text-white">
      <RegisterSw />
      {children}
    </div>
  );
}
