import { createLazyFileRoute } from '@tanstack/react-router'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/hooks/useCategories'
import { cn } from '@/lib/cn'

export const Route = createLazyFileRoute('/_app/categories/')({
  component: CategoriesPage,
})

function CategoriesPage() {
  const { data, isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const deleteCategory = useDeleteCategory()

  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const createFieldError = (createCategory.error as any)?.errors?.[0]?.message

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    createCategory.mutate(
      { name: newName.trim() },
      { onSuccess: () => setNewName('') },
    )
  }

  const categories = data?.items ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Categories</h1>

      <form onSubmit={handleCreate} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            placeholder="New category name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={255}
            className={createFieldError ? 'border-destructive ring-destructive focus-visible:ring-destructive' : ''}
          />
          <Button type="submit" disabled={createCategory.isPending || !newName.trim()}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        {createFieldError && (
          <p className="text-sm font-medium text-destructive">{createFieldError}</p>
        )}
      </form>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px p-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-11 rounded-sm" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            <ul className="divide-y">
              {categories.map((c) => (
                <CategoryRow
                  key={c.id}
                  id={c.id}
                  name={c.name}
                  editingId={editingId}
                  editName={editName}
                  onStartEdit={() => {
                    setEditingId(c.id)
                    setEditName(c.name)
                  }}
                  onEditName={setEditName}
                  onCancelEdit={() => setEditingId(null)}
                  onDelete={() => deleteCategory.mutate(c.id)}
                  isDeleting={deleteCategory.isPending}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CategoryRow({
  id,
  name,
  editingId,
  editName,
  onStartEdit,
  onEditName,
  onCancelEdit,
  onDelete,
  isDeleting,
}: {
  id: string
  name: string
  editingId: string | null
  editName: string
  onStartEdit: () => void
  onEditName: (v: string) => void
  onCancelEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  const updateCategory = useUpdateCategory(id)
  const isEditing = editingId === id
  const updateFieldError = (updateCategory.error as any)?.errors?.[0]?.message

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) return
    updateCategory.mutate(
      { name: editName.trim() },
      { onSuccess: onCancelEdit },
    )
  }

  if (isEditing) {
    return (
      <li className="flex flex-col gap-1 bg-muted/20 px-4 py-2">
        <form onSubmit={handleSave} className="flex flex-1 items-center gap-2">
          <Input
            value={editName}
            onChange={(e) => onEditName(e.target.value)}
            className={cn('h-9', updateFieldError ? 'border-destructive ring-destructive focus-visible:ring-destructive' : '')}
            autoFocus
            maxLength={255}
          />
          <Button type="submit" size="sm" disabled={updateCategory.isPending}>
            Save
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancelEdit}>
            Cancel
          </Button>
        </form>
        {updateFieldError && (
          <p className="text-sm font-medium text-destructive">{updateFieldError}</p>
        )}
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30 cursor-pointer">
      <button
        type="button"
        className="flex-1 text-left text-sm font-medium focus-visible:outline-none cursor-pointer"
        onClick={onStartEdit}
      >
        {name}
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
        disabled={isDeleting}
        aria-label="Delete category"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  )
}
