"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export function Access() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "request_access" }),
      });
      const data = await res.json();
      if (data?.ok) setSent(true);
      else setError("That email didn't look right — try again.");
    } catch {
      setError("Couldn't submit just now. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="access" className="relative section-py">
      <div className="container-px mx-auto max-w-4xl">
        <Reveal>
          <div className="glass grain relative overflow-hidden rounded-4xl p-10 text-center sm:p-16">
            <div
              className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 -translate-y-1/3"
              style={{
                background:
                  "radial-gradient(circle, rgba(34,169,92,0.22), transparent 70%)",
              }}
            />
            <h2 className="text-balance text-3xl font-semibold tracking-tightest text-gradient sm:text-5xl">
              Request access to the rail.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-pretty text-white/50">
              Merchants, partners, and builders — get early access to the Loadit
              network and the HQ routing API.
            </p>

            <div className="mx-auto mt-8 max-w-md">
              <AnimatePresence mode="wait">
                {!sent ? (
                  <motion.form
                    key="form"
                    onSubmit={submit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex flex-col gap-3 sm:flex-row"
                  >
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-rail-400/50"
                      aria-label="Email address"
                    />
                    <Button type="submit" disabled={busy} className="shrink-0">
                      {busy ? "Submitting…" : "Request Access"}
                    </Button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-full border border-signal/30 bg-signal/10 px-6 py-3 text-sm text-signal"
                  >
                    ✓ You&apos;re on the list. We&apos;ll be in touch.
                  </motion.div>
                )}
              </AnimatePresence>
              {error && !sent && (
                <p className="mt-3 text-sm text-amber-400/90">{error}</p>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
