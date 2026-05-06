import { useState } from 'react';

/**
 * A hook that "latches" a value while a condition is true.
 * Useful for keeping data present during closing animations (e.g., in Dialogs).
 */
export function useLatchedValue<T>(value: T, isLatched: boolean) {
  const [latchedValue, setLatchedValue] = useState<T>(value);

  if (isLatched && value !== latchedValue) {
    setLatchedValue(value);
  }

  return isLatched ? value : latchedValue;
}
