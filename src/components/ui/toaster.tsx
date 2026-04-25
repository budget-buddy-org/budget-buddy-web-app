import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';

const VARIANT_ICONS = {
  success: CheckCircle2,
  destructive: AlertCircle,
  default: Info,
} as const;

const VARIANT_ICON_COLORS = {
  success: 'text-income',
  destructive: 'text-destructive',
  default: 'text-muted-foreground',
} as const;

const VARIANT_DURATIONS = {
  success: 4000,
  destructive: 7000,
  default: 4000,
} as const;

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, duration, ...props }) => {
        const v = (variant ?? 'default') as keyof typeof VARIANT_ICONS;
        const Icon = VARIANT_ICONS[v];
        return (
          <Toast key={id} variant={variant} duration={duration ?? VARIANT_DURATIONS[v]} {...props}>
            <Icon className={`mt-0.5 size-5 shrink-0 ${VARIANT_ICON_COLORS[v]}`} aria-hidden />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
              {action && <div className="mt-1">{action}</div>}
            </div>
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
