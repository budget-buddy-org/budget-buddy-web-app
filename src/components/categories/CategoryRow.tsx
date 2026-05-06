import { memo } from 'react';
import { ListItem } from '@/components/ui/list-item';

export const CategoryRow = memo(function CategoryRow({
  name,
  onStartEdit,
}: {
  name: string;
  onStartEdit: () => void;
}) {
  return (
    <ListItem onClick={onStartEdit} ariaLabel={`Edit category: ${name}`}>
      <span className="text-sm font-medium">{name}</span>
    </ListItem>
  );
});
