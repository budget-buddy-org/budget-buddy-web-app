/* eslint-disable react-refresh/only-export-components -- context files intentionally mix provider components with hooks */

import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

export interface FABAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
}

interface FABContextValue {
  fab: FABAction | null;
  setFAB: (action: FABAction | null) => void;
}

const FABContext = createContext<FABContextValue | null>(null);

export function FABProvider({ children }: { children: ReactNode }) {
  // Store label/icon in state (drives re-renders), onClick in a ref (always current, no re-renders)
  const [fabMeta, setFabMeta] = useState<{ label: string; icon?: ReactNode } | null>(null);
  const onClickRef = useRef<(() => void) | null>(null);

  const setFAB = useCallback((action: FABAction | null) => {
    if (action) {
      setFabMeta({ label: action.label, icon: action.icon });
      onClickRef.current = action.onClick;
    } else {
      setFabMeta(null);
      onClickRef.current = null;
    }
  }, []);

  const fab: FABAction | null = fabMeta
    ? { ...fabMeta, onClick: () => onClickRef.current?.() }
    : null;

  return <FABContext.Provider value={{ fab, setFAB }}>{children}</FABContext.Provider>;
}

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
