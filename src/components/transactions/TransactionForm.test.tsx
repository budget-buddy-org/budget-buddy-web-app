import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionForm } from './TransactionForm';

const mockToast = vi.fn(() => ({ id: '1', dismiss: vi.fn(), update: vi.fn() }));
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockCreateTx = { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, error: null };
const mockUpdateTx = { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, error: null };
const mockDeleteTx = { mutate: vi.fn(), isPending: false };
vi.mock('@/hooks/useTransactions', () => ({
  useCreateTransaction: () => mockCreateTx,
  useUpdateTransaction: () => mockUpdateTx,
  useDeleteTransaction: () => mockDeleteTx,
}));

const mockCreateCategory = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  reset: vi.fn(),
  isPending: false,
  error: null,
};
vi.mock('@/hooks/useCategories', () => ({
  useCreateCategory: () => mockCreateCategory,
}));

// Mock UI components to simplify testing
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    type,
    loading,
    'aria-label': ariaLabel,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    disabled: boolean;
    type: 'button' | 'submit';
    loading: boolean;
    'aria-label'?: string;
  }) =>
    React.createElement(
      'button',
      {
        onClick,
        disabled: disabled || loading,
        type: type || 'button',
        'aria-label': ariaLabel,
      },
      children,
    ),
}));
vi.mock('@/components/ui/input', () => ({
  Input: ({
    value,
    onChange,
    placeholder,
    autoFocus,
  }: {
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    placeholder: string;
    autoFocus: boolean;
  }) => React.createElement('input', { value, onChange, placeholder, 'data-autofocus': autoFocus }),
}));
vi.mock('@/components/ui/select', () => ({
  Select: ({
    children,
    value,
    onChange,
  }: {
    children: React.ReactNode;
    value: string;
    onChange: React.ChangeEventHandler<HTMLSelectElement>;
  }) => React.createElement('select', { value, onChange }, children),
}));
vi.mock('@/components/ui/amount-input', () => ({
  AmountInput: ({
    value,
    onChange,
    autoFocus,
    placeholder,
  }: {
    value: string;
    onChange: (val: string) => void;
    autoFocus?: boolean;
    placeholder?: string;
  }) =>
    React.createElement('input', {
      type: 'number',
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
      'data-autofocus': autoFocus,
      placeholder,
    }),
}));
vi.mock('@/components/ui/date-picker', () => ({
  DatePicker: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
  }) => React.createElement('input', { type: 'date', value, onChange }),
}));
vi.mock('@/components/ui/transaction-type-toggle', () => ({
  TransactionTypeToggle: ({
    value,
    onChange,
  }: {
    value: 'EXPENSE' | 'INCOME';
    onChange: (val: 'EXPENSE' | 'INCOME') => void;
  }) =>
    React.createElement(
      'div',
      {},
      React.createElement(
        'button',
        { type: 'button', onClick: () => onChange('EXPENSE'), 'aria-pressed': value === 'EXPENSE' },
        'Expense',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: () => onChange('INCOME'), 'aria-pressed': value === 'INCOME' },
        'Income',
      ),
    ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', {}, children),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', {}, children),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', {}, children),
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) =>
    React.createElement('button', { type: 'button', onClick }, children),
}));

vi.mock('@/components/ConfirmationDialog', () => ({
  ConfirmationDialog: ({
    isOpen,
    onConfirm,
    title,
  }: {
    isOpen: boolean;
    onConfirm: () => void;
    title: string;
  }) =>
    isOpen
      ? React.createElement(
          'div',
          {},
          React.createElement('span', {}, title),
          React.createElement('button', { type: 'button', onClick: onConfirm }, 'Confirm Delete'),
        )
      : null,
}));

const categories = [
  { id: 'cat-1', name: 'Food' },
  { id: 'cat-2', name: 'Transport' },
];

function renderForm(props: Partial<React.ComponentProps<typeof TransactionForm>> = {}) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const defaultProps = {
    categories,
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };
  return render(
    React.createElement(
      QueryClientProvider,
      { client: qc },
      React.createElement(TransactionForm, {
        ...defaultProps,
        ...props,
      } as React.ComponentProps<typeof TransactionForm>),
    ),
  );
}

describe('TransactionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateTx.isPending = false;
    mockCreateTx.error = null;
    mockCreateCategory.isPending = false;
    mockCreateCategory.error = null;
  });

  it('renders correctly', () => {
    renderForm();
    expect(screen.getByText(/^Category/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add new/i })).toBeInTheDocument();
  });

  it('toggles between existing and new category', async () => {
    renderForm();
    const user = userEvent.setup();

    const addBtn = screen.getByRole('button', { name: /Add new/i });
    await user.click(addBtn);

    expect(screen.getByPlaceholderText(/New category name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Choose existing/i })).toBeInTheDocument();

    const backBtn = screen.getByRole('button', { name: /Choose existing/i });
    await user.click(backBtn);

    expect(screen.queryByPlaceholderText(/New category name/i)).not.toBeInTheDocument();
  });

  it('creates a new category then creates transaction', async () => {
    const onSuccess = vi.fn();
    renderForm({ onSuccess });
    const user = userEvent.setup();

    // Fill other fields
    await user.type(screen.getByPlaceholderText(/Coffee/i), 'New Coffee');
    const amountInput = screen.getAllByRole('spinbutton')[0]; // AmountInput is mocked as number input
    await user.type(amountInput, '5.50');

    // Toggle to new category
    await user.click(screen.getByRole('button', { name: /Add new/i }));
    await user.type(screen.getByPlaceholderText(/New category name/i), 'Drinks');

    // Mock category creation
    mockCreateCategory.mutateAsync.mockResolvedValueOnce({ id: 'cat-new', name: 'Drinks' });

    // Click Save
    await user.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() =>
      expect(mockCreateCategory.mutateAsync).toHaveBeenCalledWith({ name: 'Drinks' }),
    );
    await waitFor(() =>
      expect(mockCreateTx.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'New Coffee',
          amount: 550,
          categoryId: 'cat-new',
        }),
        expect.any(Object),
      ),
    );
  });

  it('shows delete confirmation and deletes transaction', async () => {
    const onSuccess = vi.fn();
    const onDeleteSuccess = vi.fn();
    const transaction = {
      id: 'tx-1',
      description: 'Old Coffee',
      amount: 500,
      currency: 'EUR',
      type: 'EXPENSE' as const,
      date: '2024-01-01',
      categoryId: 'cat-1',
    };
    renderForm({ onSuccess, onDeleteSuccess, transaction });
    const user = userEvent.setup();

    // Click the delete button
    await user.click(screen.getByRole('button', { name: /delete transaction/i }));

    // Check if confirmation dialog is shown
    expect(screen.getByText(/Delete Transaction/)).toBeInTheDocument();

    // Mock delete success
    mockDeleteTx.mutate.mockImplementationOnce(
      (_id: string, options: { onSuccess: () => void }) => {
        options.onSuccess();
      },
    );

    // Confirm delete
    await user.click(screen.getByText(/Confirm Delete/i));

    expect(mockDeleteTx.mutate).toHaveBeenCalledWith('tx-1', expect.any(Object));
    expect(onDeleteSuccess).toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  describe('PATCH body construction', () => {
    const existingTransaction = {
      id: 'tx-1',
      description: 'Old Description',
      amount: 500,
      currency: 'EUR',
      type: 'EXPENSE' as const,
      date: '2024-01-01',
      categoryId: 'cat-1',
    };

    it('sends null for description when cleared (not undefined)', async () => {
      renderForm({ transaction: existingTransaction });
      const user = userEvent.setup();

      // Clear description — user wants to remove it
      const descInput = screen.getByPlaceholderText(/Coffee/i);
      await user.clear(descInput);

      await user.click(screen.getByRole('button', { name: /Save/i }));

      expect(mockUpdateTx.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ description: null }),
        expect.any(Object),
      );
      // Explicitly verify undefined is NOT sent — that would silently skip the field in JSON
      const calledWith = mockUpdateTx.mutate.mock.calls[0][0];
      expect(calledWith).not.toMatchObject({ description: undefined });
      expect('description' in calledWith).toBe(true);
    });

    it('sends the description value when non-empty', async () => {
      renderForm({ transaction: existingTransaction });
      const user = userEvent.setup();

      const descInput = screen.getByPlaceholderText(/Coffee/i);
      await user.clear(descInput);
      await user.type(descInput, 'New Description');

      await user.click(screen.getByRole('button', { name: /Save/i }));

      expect(mockUpdateTx.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'New Description' }),
        expect.any(Object),
      );
    });

    it('sends null for description when form is submitted without one (create)', async () => {
      renderForm();
      const user = userEvent.setup();

      // Fill required fields only — leave description empty
      const amountInput = screen.getAllByRole('spinbutton')[0];
      await user.type(amountInput, '5.00');

      // Two comboboxes: currency (index 0) and category (index 1)
      const [, categorySelect] = screen.getAllByRole('combobox');
      await user.selectOptions(categorySelect, 'cat-1');

      await user.click(screen.getByRole('button', { name: /Save/i }));

      expect(mockCreateTx.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ description: null }),
        expect.any(Object),
      );
    });
  });

  it('handles autoFocus correctly', () => {
    // Create mode: should have autofocus
    const { unmount } = renderForm();
    const createInput = screen.getByPlaceholderText(/0\.00/i);
    expect(createInput).toHaveAttribute('data-autofocus', 'true');
    unmount();

    // Edit mode: should NOT have autofocus
    const transaction = {
      id: 'tx-1',
      description: 'Old Coffee',
      amount: 500,
      currency: 'EUR',
      type: 'EXPENSE' as const,
      date: '2024-01-01',
      categoryId: 'cat-1',
    };
    renderForm({ transaction });
    const editInput = screen.getByPlaceholderText(/0\.00/i);
    expect(editInput).toHaveAttribute('data-autofocus', 'false');
  });
});
