import type { Metadata } from "next";
import { DataRoomClient } from "./DataRoomClient";

/**
 * /data-room — LOADIT GLOBAL · DILIGENCE LIBRARY.
 *
 * The Loadit record in one place: corporate, IP, technology, commercial,
 * regulatory, financial, and security materials for authorized diligence.
 * Everything behind this gate is served from private storage through
 * authorized API calls — nothing confidential is in this page's HTML, and
 * the room never renders without a valid access code.
 */
export const metadata: Metadata = {
  title: "Data Room — Loadit",
  description: "Authorized diligence access to the Loadit record.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/data-room" },
};

export default function DataRoomPage() {
  return (
    <main className="min-h-screen bg-[#05070C]">
      <DataRoomClient />
    </main>
  );
}
