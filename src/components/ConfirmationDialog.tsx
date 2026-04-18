import { Check, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    if (variant === 'destructive' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row gap-2 pt-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-none sm:min-w-[100px]"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            <X className="size-4 mr-2" />
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant}
            className="flex-1 sm:flex-none sm:min-w-[100px]"
            onClick={handleConfirm}
            loading={isLoading}
          >
            {!isLoading &&
              (variant === 'destructive' ? (
                <Trash2 className="size-4 mr-2" />
              ) : (
                <Check className="size-4 mr-2" />
              ))}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
