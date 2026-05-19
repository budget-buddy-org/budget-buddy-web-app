import { memo } from 'react';
import { ListItem } from '@/components/ui/list-item';
import { useFormatters } from '@/hooks/useFormatters';
import { localeCurrency } from '@/lib/formatters';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';

export const CategoryRow = memo(function CategoryRow({
  name,
  monthlyBudget,
  onStartEdit,
}: {
  name: string;
  monthlyBudget?: number | null;
  onStartEdit: () => void;
}) {
  const { fmtCurrency } = useFormatters();
  const currency = useUserPreferencesStore((s) => s.currency) ?? localeCurrency();
  return (
    <ListItem onClick={onStartEdit} ariaLabel={`Edit category: ${name}`}>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
      {monthlyBudget != null && (
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {fmtCurrency(monthlyBudget, currency)}
        </span>
      )}
    </ListItem>
  );
});
