import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TransactionFilters } from './TransactionFilters';

vi.mock('@/components/ui/transaction-type-toggle', () => ({
  TransactionTypeToggle: ({ value, onChange }: { value: string; onChange: (v: string) => void }) =>
    React.createElement('div', { 'data-testid': 'type-toggle', 'data-value': value }, [
      React.createElement(
        'button',
        { key: 'all', type: 'button', onClick: () => onChange('') },
        'All',
      ),
      React.createElement(
        'button',
        { key: 'expense', type: 'button', onClick: () => onChange('EXPENSE') },
        'Expense',
      ),
      React.createElement(
        'button',
        { key: 'income', type: 'button', onClick: () => onChange('INCOME') },
        'Income',
      ),
    ]),
}));

vi.mock('@/components/ui/date-picker', () => ({
  DatePicker: ({
    id,
    value,
    onChange,
  }: {
    id?: string;
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
  }) => React.createElement('input', { id, type: 'date', value, onChange }),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({
    id,
    children,
    value,
    onChange,
  }: {
    id?: string;
    children: React.ReactNode;
    value: string;
    onChange: React.ChangeEventHandler<HTMLSelectElement>;
  }) => React.createElement('select', { id, value, onChange }, children),
}));

describe('TransactionFilters', () => {
  const categories = [
    { id: '1', name: 'Food' },
    { id: '2', name: 'Transport' },
  ];
  const filters = {
    categoryId: '',
    start: '',
    end: '',
    sort: 'desc' as const,
    type: '' as const,
    query: '',
    amountMin: undefined,
    amountMax: undefined,
  };
  const onFilterChange = vi.fn();
  const onReset = vi.fn();
  const onClose = vi.fn();

  it('renders correctly', () => {
    render(
      <TransactionFilters
        categories={categories}
        filters={filters}
        onFilterChange={onFilterChange}
        onReset={onReset}
        onClose={onClose}
      />,
    );

    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to/i)).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: /sort/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
  });

  it('calls onReset when reset button is clicked', () => {
    const activeFilters = { ...filters, categoryId: '1', type: '' as const };
    render(
      <TransactionFilters
        categories={categories}
        filters={activeFilters}
        onFilterChange={onFilterChange}
        onReset={onReset}
        onClose={onClose}
      />,
    );

    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);
    expect(onReset).toHaveBeenCalled();
  });

  it('calls onClose when done button is clicked', () => {
    render(
      <TransactionFilters
        categories={categories}
        filters={filters}
        onFilterChange={onFilterChange}
        onReset={onReset}
        onClose={onClose}
      />,
    );

    const doneButton = screen.getByRole('button', { name: /done/i });
    fireEvent.click(doneButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('emits amountMin in minor units when min input changes', () => {
    onFilterChange.mockClear();
    render(
      <TransactionFilters
        categories={categories}
        filters={filters}
        onFilterChange={onFilterChange}
        onReset={onReset}
        onClose={onClose}
      />,
    );

    const minInput = screen.getByLabelText(/min/i);
    fireEvent.change(minInput, { target: { value: '12.34' } });

    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ amountMin: 1234 }));
  });

  it('shows an error and blocks Done when min > max', () => {
    render(
      <TransactionFilters
        categories={categories}
        filters={{ ...filters, amountMin: 5000, amountMax: 1000 }}
        onFilterChange={onFilterChange}
        onReset={onReset}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/min amount cannot be greater/i);
    expect(screen.getByRole('button', { name: /done/i })).toBeDisabled();
  });
});
