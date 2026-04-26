import { Slot } from '@radix-ui/react-slot';
import type { VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/cn';
import { useThemeStore } from '@/stores/theme.store';
import { buttonVariants } from './button-variants';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

function renderLoadingChildren(children: React.ReactNode) {
  const arr = React.Children.toArray(children);
  const idx = arr.findIndex(React.isValidElement);
  const iconClass =
    idx >= 0
      ? ((arr[idx] as React.ReactElement<{ className?: string }>).props.className ?? 'size-4')
      : 'size-4';
  return (
    <>
      <Loader2 className={cn(iconClass, 'animate-spin')} />
      {idx >= 0 ? arr.slice(idx + 1) : arr}
    </>
  );
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading,
  children,
  disabled,
  ref,
  ...props
}: ButtonProps) {
  const glassEffect = useThemeStore((s) => s.glassEffect);
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(
        buttonVariants({ variant, size, className }),
        glassEffect && (variant === 'default' || variant === 'secondary') && 'backdrop-blur-sm',
        glassEffect && variant === 'default' && 'bg-primary/80',
        glassEffect && variant === 'secondary' && 'bg-secondary/80',
      )}
      ref={ref}
      disabled={loading || disabled}
      {...props}
    >
      {asChild ? children : loading ? renderLoadingChildren(children) : children}
    </Comp>
  );
}

export { Button };
