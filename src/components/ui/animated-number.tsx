import { useEffect, useRef, useState } from 'react';

type Props = {
  value: number;
  /** Animation duration in ms. Default 600ms. */
  duration?: number;
  /** Render the (possibly fractional) current value as a string. */
  format: (current: number) => string;
  className?: string;
};

const EASE_OUT_CUBIC = (t: number) => 1 - (1 - t) ** 3;

function prefersReducedMotion(): boolean {
  if (typeof globalThis.window === 'undefined' || typeof globalThis.matchMedia !== 'function') {
    return false;
  }
  return globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Smoothly counts from the previously displayed value to `value` using
 * requestAnimationFrame. Initial render shows `value` immediately; subsequent
 * changes animate. Reduced-motion settings collapse the animation to a single
 * frame so the value updates without movement.
 */
export function AnimatedNumber({ value, duration = 600, format, className }: Readonly<Props>) {
  const [display, setDisplay] = useState(value);
  // Updated synchronously inside `tick` so a mid-animation value change
  // animates from the *current* on-screen position, not a stale frame.
  const displayRef = useRef(value);
  const rafRef = useRef<number | null>(null);
  const firstRenderRef = useRef(true);

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      displayRef.current = value;
      return;
    }

    const from = displayRef.current;
    const effectiveDuration = prefersReducedMotion() || duration <= 0 ? 0 : duration;
    let start: number | null = null;

    const tick = (now: number) => {
      start ??= now;
      const elapsed = now - start;
      const t = effectiveDuration > 0 ? Math.min(1, elapsed / effectiveDuration) : 1;
      const eased = EASE_OUT_CUBIC(t);
      const next = t === 1 ? value : from + (value - from) * eased;
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}
