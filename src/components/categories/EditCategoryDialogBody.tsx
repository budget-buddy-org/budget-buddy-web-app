import type { Category } from '@budget-buddy-org/budget-buddy-contracts';
import type React from 'react';
import { useState } from 'react';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { useToast } from '@/hooks/use-toast';
import { useUpdateCategory } from '@/hooks/useCategories';
import { getApiError } from '@/lib/api-error';
import { inputToMinorUnits, minorUnitsToInput } from '@/lib/category-budget';

interface EditCategoryDialogBodyProps {
  category: Category;
  onClose: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export function EditCategoryDialogBody({
  category,
  onClose,
  onDelete,
  isDeleting,
}: EditCategoryDialogBodyProps) {
  const { toast } = useToast();
  const updateCategory = useUpdateCategory(category.id);

  const originalName = category.name;
  const originalBudget = minorUnitsToInput(category.monthlyBudget);

  const [name, setName] = useState(originalName);
  const [budget, setBudget] = useState(originalBudget);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fieldError = getApiError(updateCategory.error)?.errors?.[0]?.message;

  const handleUpdate = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateCategory.mutate(
      { name: name.trim(), monthlyBudget: inputToMinorUnits(budget) },
      {
        onSuccess: () => {
          toast({ title: 'Category updated', variant: 'success' });
          onClose();
        },
        onError: (error) => {
          const apiError = getApiError(error);
          if (!apiError?.errors) {
            toast({
              title: "Couldn't update category",
              description: apiError?.detail || apiError?.title,
              variant: 'destructive',
            });
          }
        },
      },
    );
  };

  const isUnchanged = name.trim() === originalName && budget === originalBudget;

  return (
    <>
      <CategoryForm
        isEditing
        name={name}
        onNameChange={setName}
        monthlyBudget={budget}
        onMonthlyBudgetChange={setBudget}
        onSubmit={handleUpdate}
        onCancel={onClose}
        onDelete={() => setShowDeleteConfirm(true)}
        isPending={updateCategory.isPending}
        error={fieldError}
        isDisabled={!name.trim() || isUnchanged}
      />
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete();
        }}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  );
}
