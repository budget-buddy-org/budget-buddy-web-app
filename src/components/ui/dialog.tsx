import * as DialogPrimitives from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/cn';

const Dialog = DialogPrimitives.Root;

const DialogTrigger = DialogPrimitives.Trigger;

const DialogPortal = DialogPrimitives.Portal;

const DialogClose = DialogPrimitives.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitives.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitives.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitives.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitives.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitives.Content> & { hideClose?: boolean }
>(({ className, children, hideClose, ...props }, forwardedRef) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const hiddenCloseRef = React.useRef<HTMLButtonElement>(null);
  const dragState = React.useRef({ isDragging: false, startY: 0 });

  const combinedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef)
        (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [forwardedRef],
  );

  const snapBack = React.useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    dragState.current.isDragging = false;
    el.style.transition = 'transform 0.3s ease';
    el.style.transform = 'translateY(0)';
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.style.transform = '';
        contentRef.current.style.transition = '';
      }
    }, 300);
  }, []);

  const handlePointerDown = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { isDragging: true, startY: e.clientY };
  }, []);

  const handlePointerMove = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.isDragging || !contentRef.current) return;
    const delta = Math.max(0, e.clientY - dragState.current.startY);
    contentRef.current.style.transform = `translateY(${delta}px)`;
    contentRef.current.style.transition = 'none';
  }, []);

  const handlePointerUp = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragState.current.isDragging) return;
      const delta = e.clientY - dragState.current.startY;
      if (delta > 80) {
        dragState.current.isDragging = false;
        const el = contentRef.current;
        if (el) {
          el.style.transition = 'transform 0.22s ease-in';
          el.style.transform = 'translateY(100vh)';
        }
        setTimeout(() => hiddenCloseRef.current?.click(), 220);
      } else {
        snapBack();
      }
    },
    [snapBack],
  );

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitives.Content
        ref={combinedRef}
        className={cn(
          'fixed z-50 grid w-full gap-4 border bg-background shadow-lg',
          // Mobile: Bottom Sheet — extra top padding to clear the drag handle
          'bottom-0 left-0 max-w-none rounded-t-xl border-x-0 border-b-0 translate-y-0 max-h-[90dvh] overflow-y-auto',
          'px-6 pt-8 pb-6',
          'data-[state=open]:animate-in-bottom-sheet data-[state=closed]:animate-out-bottom-sheet',
          // Desktop: Centered Dialog
          'sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:border sm:max-h-none sm:overflow-y-visible sm:p-6 sm:data-[state=open]:animate-fade-in sm:data-[state=closed]:animate-fade-out',
          className,
        )}
        {...props}
      >
        {/* Drag handle — mobile only */}
        <div
          className="sm:hidden absolute top-0 inset-x-0 h-8 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={snapBack}
        >
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Hidden close — triggered programmatically on swipe dismiss */}
        <DialogPrimitives.Close
          ref={hiddenCloseRef}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />

        {children}

        {!hideClose && (
          <DialogPrimitives.Close className="absolute right-4 top-4 sm:top-4 rounded-sm opacity-70 ring-offset-background transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground cursor-pointer active:scale-90 motion-reduce:transition-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitives.Close>
        )}
      </DialogPrimitives.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitives.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitives.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitives.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitives.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitives.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitives.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitives.Description.displayName;

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
