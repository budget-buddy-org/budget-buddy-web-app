import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import type * as React from 'react';

import { cn } from '@/lib/cn';

const ToastProvider = ToastPrimitives.Provider;

function ToastViewport({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport> & {
  ref?: React.Ref<React.ElementRef<typeof ToastPrimitives.Viewport>>;
}) {
  return (
    <ToastPrimitives.Viewport
      ref={ref}
      className={cn(
        'fixed inset-x-0 bottom-0 z-[100] flex max-h-screen flex-col-reverse gap-2 p-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] md:inset-x-auto md:right-0 md:max-w-[420px] md:pb-4',
        className,
      )}
      {...props}
    />
  );
}

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border bg-background p-4 pr-10 text-foreground shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full motion-reduce:animate-none motion-reduce:transition-none',
  {
    variants: {
      variant: {
        default: '',
        destructive: 'destructive group border-l-4 border-l-destructive',
        success: 'success group border-l-4 border-l-income',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Toast({
  className,
  variant,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
  VariantProps<typeof toastVariants> & {
    ref?: React.Ref<React.ElementRef<typeof ToastPrimitives.Root>>;
  }) {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
}

function ToastAction({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action> & {
  ref?: React.Ref<React.ElementRef<typeof ToastPrimitives.Action>>;
}) {
  return (
    <ToastPrimitives.Action
      ref={ref}
      className={cn(
        'inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-transparent px-2 text-sm font-medium text-primary transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

function ToastClose({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close> & {
  ref?: React.Ref<React.ElementRef<typeof ToastPrimitives.Close>>;
}) {
  return (
    <ToastPrimitives.Close
      ref={ref}
      className={cn(
        'absolute right-2 top-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring',
        className,
      )}
      toast-close=""
      {...props}
    >
      <X className="size-4" />
      <span className="sr-only">Close</span>
    </ToastPrimitives.Close>
  );
}

function ToastTitle({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title> & {
  ref?: React.Ref<React.ElementRef<typeof ToastPrimitives.Title>>;
}) {
  return (
    <ToastPrimitives.Title
      ref={ref}
      className={cn('text-sm font-semibold leading-tight', className)}
      {...props}
    />
  );
}

function ToastDescription({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description> & {
  ref?: React.Ref<React.ElementRef<typeof ToastPrimitives.Description>>;
}) {
  return (
    <ToastPrimitives.Description
      ref={ref}
      className={cn('text-sm text-muted-foreground leading-snug', className)}
      {...props}
    />
  );
}

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  Toast,
  ToastAction,
  type ToastActionElement,
  ToastClose,
  ToastDescription,
  type ToastProps,
  ToastProvider,
  ToastTitle,
  ToastViewport,
};
