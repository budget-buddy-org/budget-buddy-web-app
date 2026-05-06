import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ListItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  as?: 'li' | 'div';
  ariaLabel?: string;
}

/**
 * A reusable list item component that handles common hover, focus, and layout styles.
 * It uses a button for the main content to ensure accessibility and consistent interaction.
 */
export function ListItem({
  children,
  onClick,
  className,
  as: Component = 'li',
  ariaLabel,
}: ListItemProps) {
  const content = (
    <button
      type="button"
      aria-label={ariaLabel}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      onClick={onClick}
    >
      {children}
    </button>
  );

  return (
    <Component
      className={cn('flex items-center transition-colors', !onClick && 'px-4 py-3', className)}
    >
      {onClick ? content : children}
    </Component>
  );
}
