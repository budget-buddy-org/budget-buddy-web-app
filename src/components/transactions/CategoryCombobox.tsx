import { useMemo } from 'react';
import { Combobox } from '@/components/ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { useCreateCategory } from '@/hooks/useCategories';
import { getApiError } from '@/lib/api-error';
import { getCategoryColor } from '@/lib/categoryColor';

interface CategoryComboboxProps {
  categories: { id: string; name: string }[];
  value: string;
  onChange: (categoryId: string) => void;
  disabled?: boolean;
  error?: boolean;
  id?: string;
}

export function CategoryCombobox({
  categories,
  value,
  onChange,
  disabled,
  error,
  id,
}: Readonly<CategoryComboboxProps>) {
  const { toast } = useToast();
  const createCategory = useCreateCategory();

  const items = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories],
  );

  const handleCreate = async (name: string) => {
    try {
      const created = await createCategory.mutateAsync({ name });
      onChange(created.id);
    } catch (err) {
      const apiError = getApiError(err);
      toast({
        title: "Couldn't create category",
        description: apiError?.detail || apiError?.title,
        variant: 'destructive',
      });
    }
  };

  return (
    <Combobox
      id={id}
      items={items}
      value={value}
      onChange={onChange}
      onCreate={handleCreate}
      placeholder="Search or create category…"
      createLabel={(typed) => `Create "${typed}"`}
      disabled={disabled || createCategory.isPending}
      error={error}
      renderLeading={(item) =>
        item ? (
          <span
            aria-hidden
            className="size-3 rounded-full"
            style={{ backgroundColor: getCategoryColor(item.label) }}
          />
        ) : null
      }
    />
  );
}
