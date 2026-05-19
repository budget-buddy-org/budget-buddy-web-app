import type { Category } from '@budget-buddy-org/budget-buddy-contracts';
import { useNavigate, useSearch } from '@tanstack/react-router';
import type React from 'react';
import { useCallback, useState } from 'react';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { CategoryRow } from '@/components/categories/CategoryRow';
import { EditCategoryDialogBody } from '@/components/categories/EditCategoryDialogBody';
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
} from '@/hooks/useCategories';
import { getApiError } from '@/lib/api-error';
import { inputToMinorUnits } from '@/lib/category-budget';

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
                <Skeleton className="h-field w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-field w-full" />
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Skeleton className="h-field w-full rounded-pill" />
                <Skeleton className="h-field w-full rounded-pill" />
                <Skeleton className="h-field w-full rounded-pill" />
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
                <CategoryRow
                  key={c.id}
                  name={c.name}
                  monthlyBudget={c.monthlyBudget ?? null}
                  onStartEdit={() => openEdit(c.id)}
                />
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
