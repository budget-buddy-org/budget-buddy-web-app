import type { Category } from '@budget-buddy-org/budget-buddy-contracts';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Trash2, X } from 'lucide-react';
import type { SubmitEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { CategoryRow } from '@/components/categories/CategoryRow';
import { EditCategoryDialogBody } from '@/components/categories/EditCategoryDialogBody';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
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
import { useLatchedValue } from '@/hooks/useLatchedValue';
import { getApiError } from '@/lib/api-error';
import { inputToMinorUnits } from '@/lib/category-budget';

export function CategoriesPage() {
  const search = useSearch({ from: '/_app/categories/' });
  const navigate = useNavigate();
  const editId = search.edit ?? '';
  const { data: editTarget, isLoading: isEditLoading } = useCategory(editId);
  const isEditDialogOpen = !!editId;
  const editRender = useLatchedValue(
    useMemo(
      () => ({ category: editTarget, isLoading: isEditLoading }),
      [editTarget, isEditLoading],
    ),
    isEditDialogOpen,
  );

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
          setShowDeleteConfirm(false);
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

  const handleCreate = useCallback(
    (e: SubmitEvent) => {
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
            toast({ title: 'Category created', variant: 'success' });
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
    },
    [newName, newBudget, createCategory, toast],
  );

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
        <DialogContent aria-describedby={undefined}>
          <div className="flex items-center justify-between">
            <DialogTitle>Add Category</DialogTitle>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                aria-label="Close"
              >
                <X className="size-5" />
              </Button>
            </DialogClose>
          </div>
          <CategoryForm
            name={newName}
            onNameChange={setNewName}
            monthlyBudget={newBudget}
            onMonthlyBudgetChange={setNewBudget}
            onSubmit={handleCreate}
            isPending={createCategory.isPending}
            error={createFieldError}
            isDisabled={!newName.trim()}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeEdit();
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Category</DialogTitle>
            <div className="flex items-center gap-1">
              {editRender.category && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  aria-label="Delete category"
                >
                  <Trash2 className="size-5" />
                </Button>
              )}
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </Button>
              </DialogClose>
            </div>
          </div>
          {editRender.isLoading ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-field w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-field w-full" />
              </div>
              <div className="-mx-6 -mb-6 mt-6 px-6 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:mb-0 sm:px-0 sm:pb-0 sm:border-t">
                <Skeleton className="h-field w-full rounded-pill" />
              </div>
            </div>
          ) : (
            editRender.category && (
              <EditCategoryDialogBody
                key={editRender.category.id}
                category={editRender.category}
                onClose={closeEdit}
              />
            )
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={() => editRender.category && handleDeleteCategory(editRender.category)}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteCategory.isPending}
      />

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
