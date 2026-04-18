import { cn } from '@/lib/cn';
import { useThemeStore } from '@/stores/theme.store';
import { type BadgeProps, badgeVariants } from './badge-variants';

function Badge({ className, variant, ...props }: BadgeProps) {
  const glassEffect = useThemeStore((s) => s.glassEffect);

  return (
    <div
      className={cn(
        badgeVariants({ variant }),
        glassEffect && (variant === 'default' || variant === 'secondary' || variant === 'income')
          ? 'backdrop-blur-sm'
          : '',
        glassEffect && variant === 'default' ? 'bg-primary/80' : '',
        glassEffect && variant === 'secondary' ? 'bg-secondary/80' : '',
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
