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
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import {
  CATEGORIES_PAGE_SIZE,
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/useCategories';
import { getApiError } from '@/lib/api-error';

export function CategoriesPage() {
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
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [originalEditName, setOriginalEditName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const createFieldError = getApiError(createCategory.error)?.errors?.[0]?.message;
  const updateCategory = useUpdateCategory(editingCategory?.id ?? '');
  const updateFieldError = getApiError(updateCategory.error)?.errors?.[0]?.message;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createCategory.mutate(
      { name: newName.trim() },
      {
        onSuccess: () => {
          setNewName('');
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

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editingCategory) return;
    updateCategory.mutate(
      { name: editName.trim() },
      {
        onSuccess: () => {
          setEditingCategory(null);
          setEditName('');
          toast({
            title: 'Category updated',
            variant: 'success',
          });
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

  const handleDelete = () => {
    if (!editingCategory) return;
    const snapshot = { name: editingCategory.name };
    deleteCategory.mutate(editingCategory.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        setEditingCategory(null);
        setEditName('');
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
        toast({
          title: "Couldn't delete category",
          variant: 'destructive',
        });
      },
    });
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
            onSubmit={handleCreate}
            onCancel={() => {
              setShowForm(false);
              setNewName('');
              createCategory.reset();
            }}
            isPending={createCategory.isPending}
            error={createFieldError}
            isDisabled={!newName.trim()}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCategory(null);
            updateCategory.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Modify the name of your category</DialogDescription>
          </DialogHeader>
          <CategoryForm
            isEditing
            name={editName}
            onNameChange={setEditName}
            onSubmit={handleUpdate}
            onCancel={() => {
              setEditingCategory(null);
              updateCategory.reset();
            }}
            onDelete={() => setShowDeleteConfirm(true)}
            isPending={updateCategory.isPending}
            error={updateFieldError}
            isDisabled={!editName.trim() || editName.trim() === originalEditName}
          />
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
                  onStartEdit={() => {
                    setEditingCategory(c);
                    setEditName(c.name);
                    setOriginalEditName(c.name);
                  }}
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

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteCategory.isPending}
      />
    </PageContainer>
  );
}
