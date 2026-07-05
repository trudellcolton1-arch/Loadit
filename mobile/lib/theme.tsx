import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";

/**
 * THEME ENGINE — the user's app, the user's colors.
 *
 * Two knobs, persisted on device:
 *  - mode:   light / dark
 *  - accent: ANY hex color the user picks — every accent-driven surface in
 *    the app (buttons, links, highlights, tints, selection states) derives
 *    from it, with contrast handled automatically.
 */

export type ThemeMode = "light" | "dark";

export interface Theme {
  mode: ThemeMode;
  /** The user's chosen color, verbatim. */
  accent: string;
  /** Accent adjusted so it stays readable as TEXT on the current background. */
  accentText: string;
  /** Translucent accent for tinted card backgrounds. */
  accentSoft: string;
  /** Slightly stronger tint for selected states. */
  accentTint: string;
  /** Text/icon color that reads on top of accent-filled elements. */
  onAccent: string;
  bg: string;
  surface: string;
  card: string;
  border: string;
  text: string;
  dim: string;
  faint: string;
  /** Primary CTA fill (black pill in light mode, accent in dark mode). */
  button: string;
  buttonText: string;
  warn: string;
}

/* ---------------------------------------------------------------- helpers */

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.trim().replace(/^#/, "");
  const s = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

export function isValidHex(hex: string): boolean {
  return hexToRgb(hex) !== null;
}

export function rgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex) ?? [34, 169, 92];
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

function luminance(hex: string): number {
  const rgb = hexToRgb(hex) ?? [0, 0, 0];
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Black or white — whichever reads better on the given fill. */
export function contrastOn(hex: string): string {
  return luminance(hex) > 0.35 ? "#0B0D12" : "#FFFFFF";
}

/** Lighten (+pct) or darken (−pct) a hex color. */
export function shade(hex: string, pct: number): string {
  const rgb = hexToRgb(hex) ?? [34, 169, 92];
  const t = pct > 0 ? 255 : 0;
  const p = Math.abs(pct);
  const [r, g, b] = rgb.map((v) => Math.round(v + (t - v) * p));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/* ---------------------------------------------------------------- palette */

export const DEFAULT_ACCENT = "#22A95C";

export const ACCENT_PRESETS: { name: string; hex: string }[] = [
  { name: "Loadit Green", hex: "#22A95C" },
  { name: "Ocean", hex: "#2563EB" },
  { name: "Violet", hex: "#7C5CFF" },
  { name: "Sunset", hex: "#F97316" },
  { name: "Rose", hex: "#EC4899" },
  { name: "Crimson", hex: "#EF4444" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Gold", hex: "#D4A017" },
  { name: "Slate", hex: "#64748B" },
  { name: "Midnight", hex: "#0EA5E9" },
];

export function buildTheme(mode: ThemeMode, accent: string): Theme {
  const a = isValidHex(accent) ? accent : DEFAULT_ACCENT;
  if (mode === "light") {
    return {
      mode,
      accent: a,
      // dark enough to read as text on white — darken bright accents
      accentText: luminance(a) > 0.45 ? shade(a, -0.45) : shade(a, -0.15),
      accentSoft: rgba(a, 0.07),
      accentTint: rgba(a, 0.14),
      onAccent: contrastOn(a),
      bg: "#FFFFFF",
      surface: "#F6F7F9",
      card: "#FFFFFF",
      border: "#E6E8EC",
      text: "#0B0D12",
      dim: "rgba(11,13,18,0.60)",
      faint: "rgba(11,13,18,0.40)",
      button: "#101114",
      buttonText: "#FFFFFF",
      warn: "#B45309",
    };
  }
  return {
    mode,
    accent: a,
    // bright enough to read as text on near-black — lighten dark accents
    accentText: luminance(a) < 0.25 ? shade(a, 0.45) : shade(a, 0.15),
    accentSoft: rgba(a, 0.08),
    accentTint: rgba(a, 0.18),
    onAccent: contrastOn(a),
    bg: "#04060B",
    surface: "#0B0F1A",
    card: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.10)",
    text: "#FFFFFF",
    dim: "rgba(255,255,255,0.55)",
    faint: "rgba(255,255,255,0.35)",
    button: a,
    buttonText: contrastOn(a),
    warn: "#FBBF24",
  };
}

/* ---------------------------------------------------------------- context */

const STORE_KEY = "loadit_theme";

interface ThemeCtx {
  theme: Theme;
  mode: ThemeMode;
  accent: string;
  setMode: (m: ThemeMode) => void;
  setAccent: (hex: string) => void;
}

const Ctx = createContext<ThemeCtx>({
  theme: buildTheme("light", DEFAULT_ACCENT),
  mode: "light",
  accent: DEFAULT_ACCENT,
  setMode: () => {},
  setAccent: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [accent, setAccentState] = useState(DEFAULT_ACCENT);

  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(STORE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as { mode?: ThemeMode; accent?: string };
          if (saved.mode === "light" || saved.mode === "dark") setModeState(saved.mode);
          if (saved.accent && isValidHex(saved.accent)) setAccentState(saved.accent);
        }
      } catch {
        /* defaults are fine */
      }
    })();
  }, []);

  const persist = (m: ThemeMode, a: string) => {
    SecureStore.setItemAsync(STORE_KEY, JSON.stringify({ mode: m, accent: a })).catch(() => {});
  };
  const setMode = (m: ThemeMode) => { setModeState(m); persist(m, accent); };
  const setAccent = (hex: string) => {
    if (!isValidHex(hex)) return;
    setAccentState(hex); persist(mode, hex);
  };

  const value = useMemo(
    () => ({ theme: buildTheme(mode, accent), mode, accent, setMode, setAccent }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, accent]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  return useContext(Ctx);
}
