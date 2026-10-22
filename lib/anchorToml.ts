import { mgAnchor } from "./anchor";

/**
 * The anchor's SEP-1 stellar.toml, read server-side so the wallet can verify
 * every SEP-10 challenge really came from MoneyGram's signing key before a
 * user signs it. Cached for ten minutes; a stale copy is used if the anchor
 * is briefly unreachable so a toml hiccup does not lock people out.
 */
interface AnchorInfo {
  signingKey: string;
  webAuthEndpoint: string | null;
  transferServerSep24: string | null;
  networkPassphrase: string | null;
  fetchedAt: number;
}

const TTL_MS = 10 * 60 * 1000;
let cache: AnchorInfo | null = null;

function field(toml: string, key: string): string | null {
  const m = toml.match(new RegExp(`^\\s*${key}\\s*=\\s*"([^"]+)"`, "m"));
  return m ? m[1] : null;
}

export async function anchorInfo(): Promise<AnchorInfo | null> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < TTL_MS) return cache;
  try {
    const res = await fetch(mgAnchor().toml, { cache: "no-store" });
    if (!res.ok) throw new Error(`toml ${res.status}`);
    const text = await res.text();
    const signingKey = field(text, "SIGNING_KEY");
    if (!signingKey) throw new Error("toml has no SIGNING_KEY");
    cache = {
      signingKey,
      webAuthEndpoint: field(text, "WEB_AUTH_ENDPOINT"),
      transferServerSep24: field(text, "TRANSFER_SERVER_SEP0024"),
      networkPassphrase: field(text, "NETWORK_PASSPHRASE"),
      fetchedAt: now,
    };
    return cache;
  } catch {
    return cache; // stale or null
  }
}
