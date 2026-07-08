/**
 * Amount input helpers — shared by every money screen so parsing is identical.
 *
 * The old per-screen `v.replace(/[^0-9.]/g, "")` stripped the comma decimal
 * separator that decimal-pad produces on EU/LATAM devices ("1,50" → "150",
 * a 100× overcharge) and allowed multiple dots ("1.2.3"). This normalizes to a
 * single canonical decimal and never lets the shown text diverge from the value.
 */

/** Sanitize raw keyboard text into a valid partial decimal string to display. */
export function sanitizeAmountInput(raw: string): string {
  // Treat comma as a decimal separator, then keep only digits and dots.
  let s = raw.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  // Collapse to a single decimal point (keep the first).
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
  }
  // Cap to 2 decimal places.
  const dot = s.indexOf(".");
  if (dot !== -1) s = s.slice(0, dot + 3);
  return s;
}

/** Parse a sanitized amount string to a finite number (0 if invalid). */
export function parseAmount(text: string): number {
  const n = parseFloat(text);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
