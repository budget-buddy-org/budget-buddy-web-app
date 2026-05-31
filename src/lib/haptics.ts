/**
 * Haptic feedback helpers, feature-detected for browsers that expose the
 * Vibration API. iOS Safari does not implement it — these calls become no-ops
 * there, which is the desired behavior.
 *
 * Patterns intentionally short to feel like UI feedback rather than a
 * notification buzz.
 */

type Pattern = 'tap' | 'select' | 'success' | 'warning' | 'error';

const PATTERNS: Record<Pattern, number | number[]> = {
  tap: 8,
  select: 12,
  success: [10, 30, 10],
  warning: [20, 40, 20],
  error: [30, 50, 30],
};

let cachedSupport: boolean | null = null;
let cachedReducedMotion: boolean | null = null;

function isSupported(): boolean {
  if (cachedSupport !== null) return cachedSupport;
  cachedSupport = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  return cachedSupport;
}

function prefersReducedMotion(): boolean {
  if (cachedReducedMotion !== null) return cachedReducedMotion;
  if (typeof globalThis.window === 'undefined' || typeof globalThis.matchMedia !== 'function') {
    cachedReducedMotion = false;
    return false;
  }
  const mql = globalThis.matchMedia('(prefers-reduced-motion: reduce)');
  cachedReducedMotion = mql.matches;
  // Live-update if the user changes the setting mid-session.
  mql.addEventListener?.('change', (e) => {
    cachedReducedMotion = e.matches;
  });
  return cachedReducedMotion;
}

export function haptic(pattern: Pattern = 'tap'): void {
  if (!isSupported() || prefersReducedMotion()) return;
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    // Some browsers throw when called outside a user gesture — ignore.
  }
}
