import { Button } from '@/components/ui/button';

interface FormActionsProps {
  onCancel: () => void;
  onDelete?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  deleteLabel?: string;
  isPending?: boolean;
  isDisabled?: boolean;
  isEditing?: boolean;
  deleteAriaLabel?: string;
}

export function FormActions({
  onCancel,
  onDelete,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  deleteLabel = 'Delete',
  isPending = false,
  isDisabled = false,
  isEditing = false,
  deleteAriaLabel = 'Delete',
}: FormActionsProps) {
  return (
    <div className="flex flex-col gap-2 pt-2">
      <Button type="submit" className="w-full" loading={isPending} disabled={isDisabled}>
        {submitLabel}
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={onCancel}
        disabled={isPending}
      >
        {cancelLabel}
      </Button>
      {isEditing && onDelete && (
        <Button
          type="button"
          variant="ghost"
          aria-label={deleteAriaLabel}
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
          disabled={isPending}
        >
          {deleteLabel}
        </Button>
      )}
    </div>
  );
}
