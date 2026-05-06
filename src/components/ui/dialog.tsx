import * as DialogPrimitives from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type * as React from 'react';

import { cn } from '@/lib/cn';

const Dialog = DialogPrimitives.Root;

const DialogTrigger = DialogPrimitives.Trigger;

const DialogPortal = DialogPrimitives.Portal;

const DialogClose = DialogPrimitives.Close;

function DialogOverlay({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitives.Overlay> & {
  ref?: React.Ref<React.ElementRef<typeof DialogPrimitives.Overlay>>;
}) {
  return (
    <DialogPrimitives.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-[200] bg-black/80 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  hideClose,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitives.Content> & {
  hideClose?: boolean;
  ref?: React.Ref<React.ElementRef<typeof DialogPrimitives.Content>>;
}) {
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
      >
        {children}

        {!hideClose && (
          <DialogPrimitives.Close className="absolute right-4 top-4 sm:top-4 rounded-pill opacity-70 ring-offset-background transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground cursor-pointer active:scale-90 motion-reduce:transition-none">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitives.Close>
        )}
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
  ref?: React.Ref<React.ElementRef<typeof DialogPrimitives.Title>>;
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
  ref?: React.Ref<React.ElementRef<typeof DialogPrimitives.Description>>;
}) {
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
