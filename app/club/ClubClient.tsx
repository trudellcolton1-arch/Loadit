"use client";

import { motion } from "framer-motion";

/**
 * LOAD.CLUB — the members / rewards program for Loadit, served on load.club.
 *
 * Honesty: the program is rolling out with Loadit. This page explains it and
 * routes people to the app to start earning — it never shows a fake Load Score
 * or a live checkout. Real points, subscriptions, and fee waivers are built in
 * the production app (they touch money), not here.
 *
 * Three distinct concepts, kept separate on purpose:
 *   Loadit user  →  Load.club member (earned, free)  →  Unlimited ($35/mo)
 */

const APP = "https://loadit.net/install";
const LOADIT = "https://loadit.net";

const TIERS = [
  {
    tag: "STEP ONE",
    name: "Loadit user",
    line: "Move money on Loadit — cards today, cash at the counter as it launches.",
    note: "Free. Just get the app.",
  },
  {
    tag: "STEP TWO",
    name: "Load.club member",
    line: "Earn 500 Load Points through real activity and your place is permanent.",
    note: "Earned, not bought. Always free.",
    highlight: true,
  },
  {
    tag: "STEP THREE",
    name: "Load.club Unlimited",
    line: "Members can add Unlimited — no per-load Loadit fee, ever.",
    note: "$35 / month. Optional upgrade.",
  },
];

const ACTIONS = [
  { label: "Verify your Loadit account", pts: 100 },
  { label: "Complete your first load", pts: 100 },
  { label: "Complete 5 loads", pts: 100 },
  { label: "Complete 20 loads", pts: 100 },
  { label: "Refer an active member", pts: 100 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.5, 0.35, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function ClubClient() {
  return (
    <main className="min-h-screen bg-void text-white antialiased">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -10%, rgba(34,169,92,0.16), transparent 70%)",
        }}
      />

      {/* ——— top bar ——— */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold tracking-[0.2em] text-white">LOAD</span>
          <span className="rounded-md bg-rail px-1.5 py-0.5 font-mono text-sm font-bold tracking-[0.2em] text-void">
            .CLUB
          </span>
        </div>
        <a
          href={LOADIT}
          className="text-sm text-white/50 transition-colors hover:text-white"
        >
          ← Loadit
        </a>
      </header>

      {/* ——— hero ——— */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-mono text-[11px] font-bold uppercase tracking-[0.35em] text-rail-400"
        >
          The Loadit members program
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mt-5 max-w-3xl text-5xl font-black leading-[1.02] tracking-tightest sm:text-7xl"
        >
          You don&apos;t join.
          <br />
          <span className="text-rail-gradient">You earn your way in.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mt-6 max-w-xl text-lg leading-relaxed text-white/60"
        >
          Load.club is built for the people moving the network forward. Earn your place
          through real activity on Loadit — then unlock unlimited loads with no per-load fee.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.19 }}
          className="mt-9 flex flex-wrap items-center gap-3"
        >
          <a
            href={APP}
            className="rounded-xl bg-rail px-6 py-3.5 text-sm font-bold text-void shadow-glow transition-transform hover:scale-[1.02]"
          >
            Check my eligibility
          </a>
          <a
            href="#how"
            className="rounded-xl border border-white/15 px-6 py-3.5 text-sm font-bold text-white/80 transition-colors hover:border-white/40"
          >
            How it works
          </a>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="mt-5 font-mono text-[11px] uppercase tracking-[0.15em] text-white/35"
        >
          Rolling out with Loadit · Join the founding class
        </motion.p>
      </section>

      {/* ——— the path ——— */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-16">
        <Reveal>
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-rail-400">The path</h2>
          <p className="mt-2 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
            Three steps. Membership is earned and free — Unlimited is the only paid part.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {TIERS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <div
                className={`h-full rounded-2xl border p-6 ${
                  t.highlight
                    ? "border-rail/40 bg-rail/[0.06] shadow-glow"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                  {t.tag}
                </p>
                <p className="mt-3 text-xl font-bold">{t.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{t.line}</p>
                <p
                  className={`mt-4 text-sm font-semibold ${
                    t.highlight ? "text-rail-400" : "text-white/80"
                  }`}
                >
                  {t.note}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ——— load score ——— */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-start gap-10 md:grid-cols-2">
          <Reveal>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-rail-400">
                Your Load Score
              </h2>
              <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Earn 500 Load Points.
              </p>
              <p className="mt-4 max-w-md text-white/60">
                Points come from genuine activity — not a purchase. Hit 500 and you&apos;re a
                Load.club member for good. Here&apos;s how they add up:
              </p>
              {/* example progress — clearly labeled, not a real balance */}
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs uppercase tracking-[0.15em] text-white/40">
                    Example
                  </span>
                  <span className="font-mono text-sm text-white/60">300 / 500</span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-rail-gradient"
                    initial={{ width: 0 }}
                    whileInView={{ width: "60%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <p className="mt-3 text-xs text-white/40">
                  Sign in on the app to see your real score.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
              {ACTIONS.map((a, i) => (
                <div
                  key={a.label}
                  className={`flex items-center justify-between px-4 py-4 ${
                    i < ACTIONS.length - 1 ? "border-b border-white/8" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-rail/40 text-[11px] text-rail-400">
                      {i + 1}
                    </span>
                    <span className="text-sm text-white/80">{a.label}</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-rail-400">+{a.pts}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-4">
                <span className="text-sm font-bold">Load.club earned</span>
                <span className="font-mono text-sm font-bold text-white">500</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ——— unlimited ——— */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <Reveal>
          <div className="overflow-hidden rounded-3xl border border-rail/30 bg-gradient-to-br from-rail/[0.10] to-transparent p-8 sm:p-12">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-rail-400">
              Load.club Unlimited
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-1">
              <span className="text-5xl font-black tracking-tightest sm:text-6xl">$35</span>
              <span className="pb-2 text-white/50">/ month</span>
            </div>
            <p className="mt-5 max-w-xl text-xl font-semibold">
              Unlimited eligible loads. No per-load Loadit fee.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/55">
              &ldquo;Unlimited&rdquo; means the number of loads, not the dollar amount. Loadit&apos;s
              per-load service fee drops to $0 on eligible loads. Network and provider costs, and
              your existing account and compliance limits, still apply.
            </p>
            <a
              href={APP}
              className="mt-8 inline-block rounded-xl bg-rail px-6 py-3.5 text-sm font-bold text-void shadow-glow transition-transform hover:scale-[1.02]"
            >
              Start earning your place
            </a>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.15em] text-white/35">
              Unlimited unlocks once you&apos;re a member (500 points)
            </p>
          </div>
        </Reveal>
      </section>

      {/* ——— closing ——— */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <Reveal>
          <h2 className="text-4xl font-black tracking-tightest sm:text-6xl">
            Earn your way in.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/55">
            The people moving the network forward get the best terms in it. Start on Loadit today.
          </p>
          <a
            href={APP}
            className="mt-8 inline-block rounded-xl bg-rail px-8 py-4 text-sm font-bold text-void shadow-glow transition-transform hover:scale-[1.02]"
          >
            Check my eligibility
          </a>
        </Reveal>
      </section>

      {/* ——— footer ——— */}
      <footer className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/8 pt-8 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold tracking-[0.2em] text-white/70">LOAD</span>
            <span className="rounded bg-rail/80 px-1 py-0.5 font-mono text-xs font-bold tracking-[0.2em] text-void">
              .CLUB
            </span>
          </div>
          <p className="text-xs text-white/35">
            A members program of Loadit. Membership is free once earned. Rolling out with Loadit.
          </p>
          <a href={LOADIT} className="text-xs text-white/50 hover:text-white">
            loadit.net
          </a>
        </div>
      </footer>
    </main>
  );
}
