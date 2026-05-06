import type { ReactNode } from 'react';
import { createContext } from 'react';

export interface FABAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
}

export interface FABContextValue {
  fab: FABAction | null;
  setFAB: (action: FABAction | null) => void;
}

export const FABContext = createContext<FABContextValue | null>(null);
