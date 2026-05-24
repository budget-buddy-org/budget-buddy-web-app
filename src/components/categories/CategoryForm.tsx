import type { SubmitEvent } from 'react';
import { AmountInput } from '@/components/ui/amount-input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';

interface CategoryFormProps {
  name: string;
  onNameChange: (name: string) => void;
  monthlyBudget: string;
  onMonthlyBudgetChange: (value: string) => void;
  onSubmit: (e: SubmitEvent) => void;
  isPending: boolean;
  error?: string;
  isEditing?: boolean;
  isDisabled?: boolean;
}

export function CategoryForm({
  name,
  onNameChange,
  monthlyBudget,
  onMonthlyBudgetChange,
  onSubmit,
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

      <FormField label="Monthly budget (optional)" htmlFor="category-monthly-budget">
        <AmountInput
          id="category-monthly-budget"
          value={monthlyBudget}
          onChange={onMonthlyBudgetChange}
          allowZero
        />
      </FormField>

      <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 px-6 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-background/95 backdrop-blur-md sm:static sm:mx-0 sm:mb-0 sm:px-0 sm:pb-0 sm:bg-transparent sm:backdrop-blur-none sm:border-t">
        <Button type="submit" className="w-full" loading={isPending} disabled={isDisabled}>
          Save
        </Button>
      </div>
    </form>
  );
}
