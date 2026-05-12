import type { Category } from '@budget-buddy-org/budget-buddy-contracts';
import { useNavigate, useSearch } from '@tanstack/react-router';
import type React from 'react';
import { useCallback, useState } from 'react';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { CategoryRow } from '@/components/categories/CategoryRow';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ListSkeleton } from '@/components/ui/list-skeleton';
import { PageContainer } from '@/components/ui/page-container';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import {
  CATEGORIES_PAGE_SIZE,
  useCategories,
  useCategory,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/useCategories';
import { getApiError } from '@/lib/api-error';
import { toMinorUnits } from '@/lib/formatters';

function minorUnitsToInput(value: number | null | undefined): string {
  if (value == null) return '';
  return (value / 100).toFixed(2);
}

function inputToMinorUnits(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return toMinorUnits(parsed);
}

export function CategoriesPage() {
  const search = useSearch({ from: '/_app/categories/' });
  const navigate = useNavigate();
  const editId = search.edit ?? '';
  const { data: editTarget, isLoading: isEditLoading } = useCategory(editId);

  const [page, setPage] = useState(0);
  const { data, isLoading } = useCategories(CATEGORIES_PAGE_SIZE, page);
  const total = data?.meta?.total ?? 0;

  const { toast } = useToast();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [showForm, setShowForm] = useState(false);

  const createFieldError = getApiError(createCategory.error)?.errors?.[0]?.message;

  const openEdit = useCallback(
    (id: string) => {
      navigate({ to: '/categories', search: { edit: id } });
    },
    [navigate],
  );

  const closeEdit = useCallback(() => {
    navigate({ to: '/categories', search: {}, replace: true });
  }, [navigate]);

  const handleDeleteCategory = useCallback(
    (category: Category) => {
      const snapshot = { name: category.name, monthlyBudget: category.monthlyBudget ?? null };
      deleteCategory.mutate(category.id, {
        onSuccess: () => {
          closeEdit();
          const { dismiss } = toast({
            title: 'Category deleted',
            variant: 'success',
            duration: 6000,
            action: (
              <ToastAction
                altText="Undo delete"
                onClick={() => {
                  createCategory.mutate(snapshot, {
                    onSuccess: () => {
                      toast({ title: 'Category restored', variant: 'success' });
                    },
                    onError: () => {
                      toast({ title: "Couldn't restore category", variant: 'destructive' });
                    },
                  });
                  dismiss();
                }}
              >
                Undo
              </ToastAction>
            ),
          });
        },
        onError: () => {
          toast({ title: "Couldn't delete category", variant: 'destructive' });
        },
      });
    },
    [closeEdit, createCategory, deleteCategory, toast],
  );

  const handleCreate = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createCategory.mutate(
      { name: newName.trim(), monthlyBudget: inputToMinorUnits(newBudget) },
      {
        onSuccess: () => {
          setNewName('');
          setNewBudget('');
          setShowForm(false);
          setPage(0);
          toast({
            title: 'Category created',
            variant: 'success',
          });
        },
        onError: (error) => {
          const apiError = getApiError(error);
          if (!apiError?.errors) {
            toast({
              title: "Couldn't create category",
              description: apiError?.detail || apiError?.title,
              variant: 'destructive',
            });
          }
        },
      },
    );
  };

  const categories = data?.items ?? [];

  return (
    <PageContainer>
      <PageHeader
        title="Categories"
        subtitle="Manage categories to organize your transactions"
        primaryAction={{
          label: 'Add',
          onClick: () => setShowForm((v) => !v),
        }}
      />

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) {
            setNewName('');
            setNewBudget('');
            createCategory.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Create a new category to group your transactions</DialogDescription>
          </DialogHeader>
          <CategoryForm
            name={newName}
            onNameChange={setNewName}
            monthlyBudget={newBudget}
            onMonthlyBudgetChange={setNewBudget}
            onSubmit={handleCreate}
            onCancel={() => {
              setShowForm(false);
              setNewName('');
              setNewBudget('');
              createCategory.reset();
            }}
            isPending={createCategory.isPending}
            error={createFieldError}
            isDisabled={!newName.trim()}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editId}
        onOpenChange={(open) => {
          if (!open) closeEdit();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Modify the name and budget of your category</DialogDescription>
          </DialogHeader>
          {isEditLoading ? (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex gap-2 pt-2">
                <Skeleton className="size-10 rounded-md shrink-0" />
                <div className="flex-1 flex gap-2">
                  <Skeleton className="h-10 flex-1 rounded-pill" />
                  <Skeleton className="h-10 flex-1 rounded-pill" />
                </div>
              </div>
            </div>
          ) : (
            editTarget && (
              <EditCategoryDialogBody
                key={editTarget.id}
                category={editTarget}
                onClose={closeEdit}
                onDelete={() => handleDeleteCategory(editTarget)}
                isDeleting={deleteCategory.isPending}
              />
            )
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <ListSkeleton count={6} />
          ) : categories.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            <ul className="divide-y">
              {categories.map((c) => (
                <CategoryRow key={c.id} name={c.name} onStartEdit={() => openEdit(c.id)} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {!isLoading && categories.length > 0 && (
        <Pagination
          page={page}
          total={total}
          size={CATEGORIES_PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      )}
    </PageContainer>
  );
}

function EditCategoryDialogBody({
  category,
  onClose,
  onDelete,
  isDeleting,
}: {
  category: Category;
  onClose: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
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
        isDisabled={!name.trim() || (name.trim() === originalName && budget === originalBudget)}
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
