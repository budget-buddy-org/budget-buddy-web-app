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
        'fixed top-0 z-[100] flex max-h-screen w-full flex-col p-4 pt-[calc(env(safe-area-inset-top)+1rem)] sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col sm:pb-4 sm:pt-4 md:max-w-[420px]',
        className,
      )}
      {...props}
    />
  );
}

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full sm:data-[state=open]:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive:
          'destructive group border-destructive bg-destructive text-destructive-foreground',
        success: 'success group border-income bg-income text-white',
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
        'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive',
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
        'absolute right-1 top-1 rounded-md p-1 text-foreground/50 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600 group-[.success]:text-green-100 group-[.success]:hover:text-white group-[.success]:focus:ring-green-400 group-[.success]:focus:ring-offset-green-600',
        className,
      )}
      toast-close=""
      {...props}
    >
      <X className="size-4" />
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
      className={cn('text-sm font-semibold [&+div]:text-xs', className)}
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
      className={cn('text-sm opacity-90', className)}
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
