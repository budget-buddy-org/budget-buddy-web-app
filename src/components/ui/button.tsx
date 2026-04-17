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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const { glassEffect } = useThemeStore();
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
        {asChild ? (
          children
        ) : loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button };
