import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Real live energy data for the Energy-Backed Money desk.
 *  - Day-ahead power spot price (€/MWh) from energy-charts.info (Fraunhofer ISE)
 *  - EUR→USD from Frankfurter (to derive $/kWh)
 *  - Live grid carbon intensity + generation mix from the UK Carbon Intensity API
 * Everything degrades gracefully to sensible references if a source is down.
 */
export async function GET() {
  let eurPerMwh = 0;
  let eurUsd = 1.08;
  let intensity = 0;
  let index = "";
  let mix: { fuel: string; perc: number }[] = [];

  const today = new Date().toISOString().slice(0, 10);

  // Power spot price (Germany day-ahead).
  try {
    const r = await fetch(
      `https://api.energy-charts.info/price?bzn=DE&start=${today}&end=${today}`,
      { next: { revalidate: 300 } }
    );
    if (r.ok) {
      const d = await r.json();
      const arr: number[] = d?.price ?? [];
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i] != null && !Number.isNaN(arr[i])) {
          eurPerMwh = arr[i];
          break;
        }
      }
    }
  } catch {
    /* ignore */
  }

  // EUR → USD.
  try {
    const r = await fetch("https://api.frankfurter.app/latest?from=EUR&to=USD", {
      next: { revalidate: 600 },
    });
    if (r.ok) {
      const d = await r.json();
      if (d?.rates?.USD) eurUsd = d.rates.USD;
    }
  } catch {
    /* ignore */
  }

  // Live grid carbon intensity + generation mix (UK).
  try {
    const r = await fetch("https://api.carbonintensity.org.uk/intensity", {
      next: { revalidate: 120 },
    });
    if (r.ok) {
      const d = await r.json();
      intensity = d?.data?.[0]?.intensity?.actual ?? d?.data?.[0]?.intensity?.forecast ?? 0;
      index = d?.data?.[0]?.intensity?.index ?? "";
    }
  } catch {
    /* ignore */
  }
  try {
    const r = await fetch("https://api.carbonintensity.org.uk/generation", {
      next: { revalidate: 120 },
    });
    if (r.ok) {
      const d = await r.json();
      mix = d?.data?.generationmix ?? [];
    }
  } catch {
    /* ignore */
  }

  // Reference fallbacks so the desk always renders.
  const estimate = eurPerMwh === 0;
  if (estimate) eurPerMwh = 95; // ~typical EU day-ahead
  const priceUsdPerKwh = (eurPerMwh / 1000) * eurUsd;

  if (mix.length === 0) {
    mix = [
      { fuel: "wind", perc: 32 },
      { fuel: "gas", perc: 28 },
      { fuel: "nuclear", perc: 15 },
      { fuel: "solar", perc: 9 },
      { fuel: "imports", perc: 8 },
      { fuel: "biomass", perc: 5 },
      { fuel: "hydro", perc: 3 },
    ];
  }
  if (!intensity) intensity = 180;
  if (!index) index = intensity < 130 ? "low" : intensity < 220 ? "moderate" : "high";

  const renewable = mix
    .filter((m) => ["wind", "solar", "hydro", "biomass"].includes(m.fuel))
    .reduce((s, m) => s + m.perc, 0);

  return NextResponse.json({
    ok: true,
    estimate,
    priceUsdPerKwh,
    eurPerMwh,
    eurUsd,
    intensity,
    index,
    renewable,
    mix,
    ts: Date.now(),
  });
}
