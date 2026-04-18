// Curated hues — spread across the wheel, avoiding expense-red (~0°) and income-green (~142°).
// Each resolves to a visually distinct, accessible colour at fixed saturation/lightness.
const HUES = [210, 250, 280, 310, 335, 25, 50, 70, 160, 185] as const;

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0; // keep unsigned 32-bit
  }
  return hash;
}

/**
 * Returns a deterministic HSL colour string for a category name.
 * Same name → same colour across renders and sessions.
 * Uses light-dark() so the colour adapts to the current colour scheme.
 */
export function getCategoryColor(name: string): string {
  const hue = HUES[hashString(name) % HUES.length];
  return `light-dark(hsl(${hue} 65% 45%), hsl(${hue} 60% 65%))`;
}
