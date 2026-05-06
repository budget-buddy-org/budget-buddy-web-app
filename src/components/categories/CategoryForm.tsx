import type { FormEvent } from 'react';
import { FormActions } from '@/components/ui/form-actions';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';

interface CategoryFormProps {
  name: string;
  onNameChange: (name: string) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isPending: boolean;
  error?: string;
  isEditing?: boolean;
  isDisabled?: boolean;
}

/**
 * A reusable form for creating or editing a category.
 */
export function CategoryForm({
  name,
  onNameChange,
  onSubmit,
  onCancel,
  onDelete,
  isPending,
  error,
  isEditing = false,
  isDisabled = false,
}: CategoryFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField label="Name" required error={error} htmlFor="category-name">
        <Input
          id="category-name"
          placeholder={isEditing ? 'Category name…' : 'New category name…'}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={255}
          autoFocus
          autoComplete="off"
          error={!!error}
        />
      </FormField>

      <FormActions
        onCancel={onCancel}
        onDelete={onDelete}
        isPending={isPending}
        isDisabled={isDisabled}
        isEditing={isEditing}
        deleteAriaLabel="Delete category"
      />
    </form>
  );
}
