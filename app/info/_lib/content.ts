/**
 * LOADIT.INFO — public, client-safe content: site constants, navigation, and
 * the route explorer's data. No sourcing notes live here (see claims.ts).
 */

export const INFO = {
  name: "Loadit Investors",
  domain: "loadit.info",
  url: "https://loadit.info",
  title: "Loadit for Investors — Connecting how people pay with how value is received",
  description:
    "Loadit is building infrastructure that coordinates movement between cash, traditional payment systems, and digital assets. Investor overview: the problem, the product, verified progress, business model, roadmap, and how to start a conversation.",
  company: "Loadit, Inc.",
  contact: "colt@loadit.net",
  product: "https://loadit.net",
  business: "https://loaditglobal.com",
  vision: "https://loadit.world",
  dataRoom: "https://loadit.net/data-room",
} as const;

export const NAV = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Patent", href: "#patent" },
  { label: "Products", href: "#products" },
  { label: "Progress", href: "#progress" },
  { label: "Business model", href: "#business-model" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "Contact", href: "#contact" },
] as const;

/** Status vocabulary — readable without color. */
export type Status = "today" | "testing" | "planned";
export const STATUS_LABEL: Record<Status, string> = {
  today: "Available today",
  testing: "In testing",
  planned: "Planned",
};
export const STATUS_GLYPH: Record<Status, string> = { today: "●", testing: "◐", planned: "○" };

/* ------------------------------------------------------------- route explorer */

export interface Endpoint {
  id: string;
  label: string;
  detail: string;
}

export const SOURCES: Endpoint[] = [
  { id: "cash", label: "Cash at a counter", detail: "Handed to a licensed cash-network agent" },
  { id: "card", label: "Card", detail: "Debit or credit, completed by a licensed partner" },
  { id: "bank", label: "Bank funds", detail: "A bank transfer" },
  { id: "asset", label: "Digital asset", detail: "Value the sender already holds" },
];

export const DESTINATIONS: Endpoint[] = [
  { id: "asset", label: "Supported digital asset", detail: "Delivered to a wallet the recipient controls" },
  { id: "stablecoin", label: "Supported stablecoin", detail: "USD-denominated, in the recipient's wallet" },
  { id: "payout", label: "Recipient's payout method", detail: "Bank or local cash, through a licensed partner" },
  { id: "merchant", label: "Merchant settlement", detail: "The business receives the currency it chose" },
];

export interface RouteView {
  status: Status;
  steps: string[];
  note: string;
}

/**
 * Status for a source → destination pair, derived from what exists:
 * cash/card → digital asset is the first product (prototype today; production
 * app being built; cash certification complete). Everything else is planned.
 */
export function describeRoute(source: string, dest: string): RouteView {
  const toDigital = dest === "asset" || dest === "stablecoin";
  if ((source === "cash" || source === "card") && toDigital) {
    return {
      status: "testing",
      steps: [
        source === "cash" ? "Cash handed to a licensed cash-network agent, who verifies identity" : "Card payment completed by a licensed partner",
        "Loadit coordinates: normalizes the value, selects a supported network, tracks every step",
        `${dest === "stablecoin" ? "Stablecoin" : "The chosen asset"} delivered to a wallet the recipient controls`,
      ],
      note:
        source === "cash"
          ? "The first product. Certification with a licensed national cash network is complete; consumer cash-in launches with the production app, which is being built. Works in the prototype today."
          : "The first product. Works in the prototype today; launches for customers with the production app, which is being built.",
    };
  }
  if (source === "bank" && toDigital) {
    return {
      status: "planned",
      steps: ["Bank transfer received through a licensed partner", "Loadit coordinates conversion and network selection", "Delivered to a wallet the recipient controls"],
      note: "Bank-funded routes exist in the routing engine; there is no customer surface yet.",
    };
  }
  if (source === "asset" && toDigital) {
    return {
      status: "planned",
      steps: ["Digital asset held by the sender", "Loadit coordinates conversion across supported liquidity", "A different asset or network, delivered to the recipient"],
      note: "The conversion engine plans these steps inside the first product today; a standalone conversion feature is planned.",
    };
  }
  if (dest === "payout") {
    return {
      status: "planned",
      steps: [`${label(SOURCES, source)} in`, "Loadit coordinates conversion and selects a licensed exit partner", "Bank or local cash payout to the recipient"],
      note: "Depends on payout partners in each corridor. Planned; not available.",
    };
  }
  return {
    status: "planned",
    steps: [`${label(SOURCES, source)} from the customer`, "Loadit coordinates conversion and settlement", "The merchant receives the currency it chose"],
    note: "Requires issuing and settlement partners. Planned; not available.",
  };
}

function label(list: Endpoint[], id: string): string {
  return list.find((e) => e.id === id)?.label ?? id;
}
