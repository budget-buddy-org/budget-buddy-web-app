import type { ReactNode } from 'react';
import { useCallback, useRef, useState } from 'react';
import { type FABAction, FABContext } from './fab-context';

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
