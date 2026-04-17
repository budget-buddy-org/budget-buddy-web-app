import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CategoryRow({
  name,
  onStartEdit,
  onDelete,
  isDeleting,
}: {
  name: string;
  onStartEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <li className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30 cursor-pointer">
      <button
        type="button"
        aria-label={`Edit category: ${name}`}
        className="flex-1 cursor-pointer text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        onClick={onStartEdit}
      >
        {name}
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onClick={onDelete}
        disabled={isDeleting}
        aria-label="Delete category"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}
