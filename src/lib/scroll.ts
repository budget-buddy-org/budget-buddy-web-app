/**
 * Smoothly scrolls the window back to the top.
 *
 * Used after navigation taps and after creating list items, so the user lands
 * at a predictable position instead of being stranded mid-list. Honours
 * `prefers-reduced-motion` by jumping instantly for users who opt out of motion.
 */
export function scrollToTop(): void {
  const prefersReducedMotion =
    globalThis.window !== undefined &&
    !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  globalThis.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
}
