import { Redirect } from "expo-router";
import { useAuth } from "@/lib/authContext";
import { canSeeRailPoc, isRailOwner } from "@/lib/config";

/**
 * Practice is no longer a separate product surface. The MoneyGram playground
 * lives inside the owner-gated Rail POC so the walk is one machine.
 * Old /practice links land on the same POC — guests and non-owners never see it.
 */
export default function Practice() {
  const { session, ready, hylaqStatus } = useAuth();

  if (ready && !session) return <Redirect href="/login" />;
  if (
    ready &&
    session &&
    !(
      (hylaqStatus === "checking" && session.kind === "hylaq" && isRailOwner(session.email)) ||
      canSeeRailPoc(session.email, session.kind, hylaqStatus)
    )
  ) {
    return <Redirect href="/" />;
  }
  return <Redirect href="/rail" />;
}
