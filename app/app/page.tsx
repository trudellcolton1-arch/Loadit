import { walletNetworkConfig } from "@/lib/anchor";
import { AppShell } from "./_components/AppShell";

export const dynamic = "force-dynamic";

/**
 * /app — the Loadit wallet as an installable web app.
 * Cash → USDC and USDC → cash through the certified cash network's Stellar
 * anchor (SEP-10 + SEP-24), with a key that only exists on the user's device.
 * The network (testnet vs public) is decided by STELLAR_NETWORK on the server
 * and shown to the user on every screen while in test mode.
 */
export default function WalletPage() {
  return <AppShell cfg={walletNetworkConfig()} />;
}
