import type { Metadata } from "next";
import { ClubClient } from "./ClubClient";

/**
 * /club — the Load.club experience, served on the load.club domain via
 * middleware rewrite (load.club/ → /club). Its own chrome, distinct from
 * loadit.net, but the same brand system.
 */
export const metadata: Metadata = {
  title: "Load.club — You don't join. You earn your way in.",
  description:
    "Load.club is the members program for Loadit. Earn 500 Load Points through real activity to become a member — free once earned — then add Unlimited for $35/month with no per-load Loadit fee.",
  alternates: { canonical: "https://load.club" },
  openGraph: {
    title: "Load.club — You don't join. You earn your way in.",
    description:
      "The Loadit members program. Earn your place, then unlock unlimited loads with no per-load fee.",
    url: "https://load.club",
    siteName: "Load.club",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Load.club — You earn your way in.",
    description: "The Loadit members program.",
  },
  robots: { index: true, follow: true },
};

export default function ClubPage() {
  return <ClubClient />;
}
