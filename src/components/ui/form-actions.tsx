import { Check, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FormActionsProps {
  onCancel: () => void;
  onDelete?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  isDisabled?: boolean;
  isEditing?: boolean;
  deleteAriaLabel?: string;
}

/**
 * A reusable row of form actions (Save, Cancel, and optional Delete).
 */
export function FormActions({
  onCancel,
  onDelete,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isPending = false,
  isDisabled = false,
  isEditing = false,
  deleteAriaLabel = 'Delete',
}: FormActionsProps) {
  return (
    <div className="flex items-center gap-2 pt-2">
      {isEditing && onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={deleteAriaLabel}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
          disabled={isPending}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
      <div className="flex flex-1 gap-2">
        <Button type="submit" className="flex-1" loading={isPending} disabled={isDisabled}>
          <Check className="size-4 mr-2" />
          {submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={isPending}
        >
          <X className="size-4 mr-2" />
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
}
