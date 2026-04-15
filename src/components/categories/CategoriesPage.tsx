import type { Problem } from '@budget-buddy-org/budget-buddy-contracts';
import { Check, Search, X } from 'lucide-react';
import { useState } from 'react';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { CategoryRow } from '@/components/categories/CategoryRow';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@/hooks/use-toast';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/useCategories';
import { useIsMobile } from '@/hooks/useIsMobile';

const PAGE_SIZE = 20;

export function CategoriesPage() {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm);
  // Fetch a larger set when searching (client-side filter); use page size otherwise.
  const size = debouncedSearch ? 200 : PAGE_SIZE;
  const { data, isLoading } = useCategories(size, page, debouncedSearch || undefined);
  const total = data?.meta?.total ?? 0;

  const [prevSearch, setPrevSearch] = useState(debouncedSearch);
  if (debouncedSearch !== prevSearch) {
    setPage(0);
    setPrevSearch(debouncedSearch);
  }

  const { toast } = useToast();
  const isMobile = useIsMobile();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const [newName, setNewName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const createFieldError = (createCategory.error as unknown as Problem)?.errors?.[0]?.message;
  const updateCategory = useUpdateCategory(editingCategory?.id ?? '');
  const updateFieldError = (updateCategory.error as unknown as Problem)?.errors?.[0]?.message;

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
            description: 'Your new category has been added successfully.',
            variant: 'default',
          });
        },
        onError: (error) => {
          const apiError = error as unknown as Problem;
          if (!apiError.errors) {
            toast({
              title: 'Error',
              description:
                apiError.detail || apiError.title || 'Failed to create category. Please try again.',
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
            description: 'The category name has been changed.',
            variant: 'default',
          });
        },
        onError: (error) => {
          const apiError = error as unknown as Problem;
          if (!apiError.errors) {
            toast({
              title: 'Error',
              description: apiError.detail || apiError.title || 'Failed to update category.',
              variant: 'destructive',
            });
          }
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteCategory.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
        toast({
          title: 'Category deleted',
          description: 'The category has been removed.',
          variant: 'default',
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to delete category.',
          variant: 'destructive',
        });
      },
    });
  };

  const categories = data?.items ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Categories"
        subtitle="Manage categories to organize your transactions."
        primaryAction={{
          label: 'Add',
          onClick: () => setShowForm((v) => !v),
        }}
      />

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search categories…"
          className="pl-9 text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoComplete="off"
          aria-label="Search categories"
        />
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Create a new category to group your transactions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 animate-fade-in">
            <div className="space-y-1">
              <label htmlFor="category-name" className="text-xs font-medium text-muted-foreground">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="category-name"
                placeholder="New category name…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={255}
                autoFocus={!isMobile}
                autoComplete="off"
                className={
                  createFieldError
                    ? 'border-destructive ring-destructive focus-visible:ring-destructive'
                    : ''
                }
              />
              {createFieldError && (
                <p className="text-xs font-medium text-destructive">{createFieldError}</p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                className="flex-1"
                loading={createCategory.isPending}
                disabled={!newName.trim()}
              >
                <Check className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowForm(false)}
                disabled={createCategory.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Modify the name of your category.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 animate-fade-in">
            <div className="space-y-1">
              <label
                htmlFor="edit-category-name"
                className="text-xs font-medium text-muted-foreground"
              >
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="edit-category-name"
                placeholder="Category name…"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={255}
                autoFocus={!isMobile}
                autoComplete="off"
                className={
                  updateFieldError
                    ? 'border-destructive ring-destructive focus-visible:ring-destructive'
                    : ''
                }
              />
              {updateFieldError && (
                <p className="text-xs font-medium text-destructive">{updateFieldError}</p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                className="flex-1"
                loading={updateCategory.isPending}
                disabled={!editName.trim() || editName.trim() === editingCategory?.name}
              >
                <Check className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setEditingCategory(null)}
                disabled={updateCategory.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y animate-fade-in">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                </div>
              ))}
            </div>
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
                  }}
                  onDelete={() => setDeleteId(c.id)}
                  isDeleting={deleteCategory.isPending && deleteId === c.id}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {!isLoading && categories.length > 0 && (
        <Pagination page={page} total={total} size={size} onPageChange={setPage} />
      )}

      <ConfirmationDialog
        isOpen={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteCategory.isPending}
      />
    </div>
  );
}
