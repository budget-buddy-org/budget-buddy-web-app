import { useContext, useEffect, useLayoutEffect, useRef } from 'react';
import type { FABAction } from '@/contexts/fab-context';
import { FABContext } from '@/contexts/fab-context';

export function useFABContext() {
  const ctx = useContext(FABContext);
  if (!ctx) throw new Error('useFABContext must be used within FABProvider');
  return ctx;
}

/**
 * Register a FAB action for the current page.
 * The action is cleared automatically on unmount.
 * `onClick` is tracked via a ref — inline arrow functions are safe to pass.
 */
export function useFABAction(action: FABAction | null) {
  const { setFAB } = useFABContext();

  // Keep onClick ref current after every render without triggering re-registration
  const onClickRef = useRef<(() => void) | null>(null);
  useLayoutEffect(() => {
    onClickRef.current = action?.onClick ?? null;
  });

  // Re-register when label or icon changes (semantic identity of the action).
  // onClick intentionally omitted — it is always current via the ref above.
  useEffect(() => {
    if (action?.label) {
      setFAB({
        label: action.label,
        icon: action.icon,
        onClick: () => onClickRef.current?.(),
      });
    } else {
      setFAB(null);
    }
    return () => setFAB(null);
  }, [action?.label, action?.icon, setFAB]);
}
