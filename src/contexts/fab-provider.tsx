import type { ReactNode } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { type FABAction, FABContext } from './fab-context';

export function FABProvider({ children }: Readonly<{ children: ReactNode }>) {
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

  // Memoize so the context value is stable across renders that don't change
  // fabMeta. The onClick closure reads onClickRef, so it stays current without
  // needing to be part of the dependency list.
  const value = useMemo(() => {
    const fab: FABAction | null = fabMeta
      ? { ...fabMeta, onClick: () => onClickRef.current?.() }
      : null;
    return { fab, setFAB };
  }, [fabMeta, setFAB]);

  return <FABContext.Provider value={value}>{children}</FABContext.Provider>;
}
