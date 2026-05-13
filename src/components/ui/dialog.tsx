import * as DialogPrimitives from '@radix-ui/react-dialog';
import type * as React from 'react';

import { cn } from '@/lib/cn';
import { useThemeStore } from '@/stores/theme.store';

const Dialog = DialogPrimitives.Root;
const DialogPortal = DialogPrimitives.Portal;
function DialogOverlay({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitives.Overlay> & {
  ref?: React.Ref<React.ComponentRef<typeof DialogPrimitives.Overlay>>;
}) {
  return (
    <DialogPrimitives.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitives.Content> & {
  ref?: React.Ref<React.ComponentRef<typeof DialogPrimitives.Content>>;
}) {
  const showDescriptions = useThemeStore((s) => s.showDescriptions);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitives.Content
        ref={ref}
        className={cn(
          'fixed z-[200] grid w-full gap-4 border bg-background shadow-lg',
          // Mobile: Bottom Sheet
          'bottom-0 left-0 max-w-none rounded-t-lg border-x-0 border-b-0 translate-y-0 max-h-[90dvh] overflow-y-auto',
          'p-6',
          'data-[state=open]:animate-in-bottom-sheet data-[state=closed]:animate-out-bottom-sheet',
          // Desktop: Centered Dialog
          'sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:border sm:max-h-none sm:overflow-y-visible sm:p-6 sm:data-[state=open]:animate-fade-in sm:data-[state=closed]:animate-fade-out',
          className,
        )}
        {...props}
        {...(!showDescriptions && { 'aria-describedby': undefined })}
      >
        {children}
      </DialogPrimitives.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitives.Title> & {
  ref?: React.Ref<React.ComponentRef<typeof DialogPrimitives.Title>>;
}) {
  return (
    <DialogPrimitives.Title
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitives.Description> & {
  ref?: React.Ref<React.ComponentRef<typeof DialogPrimitives.Description>>;
}) {
  const showDescriptions = useThemeStore((s) => s.showDescriptions);

  if (!showDescriptions) return null;

  return (
    <DialogPrimitives.Description
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
};
