import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { localeCurrency } from '@/lib/formatters';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';
import { TransactionForm } from './TransactionForm';

const mockToast = vi.fn(() => ({ id: '1', dismiss: vi.fn(), update: vi.fn() }));
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockCreateTx = { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, error: null };
const mockUpdateTx = { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, error: null };
vi.mock('@/hooks/useTransactions', () => ({
  useCreateTransaction: () => mockCreateTx,
  useUpdateTransaction: () => mockUpdateTx,
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

// Mock the new sub-components with test-friendly shells exposing the
// underlying state via plain inputs/selects we can drive from tests.
vi.mock('@/components/transactions/HeroAmountInput', () => ({
  HeroAmountInput: ({
    type,
    amount,
    currency,
    onTypeChange,
    onAmountChange,
    onCurrencyChange,
    autoFocus,
  }: {
    type: 'EXPENSE' | 'INCOME';
    amount: string;
    currency: string;
    onTypeChange: (v: 'EXPENSE' | 'INCOME') => void;
    onAmountChange: (v: string) => void;
    onCurrencyChange: (v: string) => void;
    autoFocus?: boolean;
  }) =>
    React.createElement(
      'div',
      {},
      React.createElement('input', {
        'aria-label': 'amount-test',
        placeholder: '0.00',
        value: amount,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => onAmountChange(e.target.value),
        'data-autofocus': autoFocus ? 'true' : 'false',
      }),
      React.createElement(
        'select',
        {
          'aria-label': 'currency-test',
          value: currency,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onCurrencyChange(e.target.value),
        },
        ['EUR', 'GBP', 'JPY', 'USD'].map((c) =>
          React.createElement('option', { key: c, value: c }, c),
        ),
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => onTypeChange('EXPENSE'),
          'aria-pressed': type === 'EXPENSE',
        },
        'Expense',
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => onTypeChange('INCOME'),
          'aria-pressed': type === 'INCOME',
        },
        'Income',
      ),
    ),
}));

vi.mock('@/components/transactions/CategoryCombobox', () => ({
  CategoryCombobox: ({
    categories,
    value,
    onChange,
  }: {
    categories: { id: string; name: string }[];
    value: string;
    onChange: (id: string) => void;
  }) =>
    React.createElement(
      'select',
      {
        'aria-label': 'category-test',
        value,
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value),
      },
      [
        React.createElement('option', { key: '', value: '' }, 'None'),
        ...categories.map((c) => React.createElement('option', { key: c.id, value: c.id }, c.name)),
      ],
    ),
}));

vi.mock('@/components/ui/date-quick-picker', () => ({
  DateQuickPicker: ({ value, onChange }: { value: string; onChange: (v: string) => void }) =>
    React.createElement('input', {
      'aria-label': 'date-test',
      type: 'date',
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    }),
}));

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
    useUserPreferencesStore.setState({ currency: null, dateFormat: 'medium', numberLocale: null });
  });

  it('renders the three zones', () => {
    renderForm();
    expect(screen.getByLabelText('amount-test')).toBeInTheDocument();
    expect(screen.getByLabelText('category-test')).toBeInTheDocument();
    expect(screen.getByLabelText('date-test')).toBeInTheDocument();
  });

  describe('default currency', () => {
    it('pre-fills currency from locale when no preference is set', () => {
      renderForm();
      const currencySelect = screen.getByLabelText('currency-test') as HTMLSelectElement;
      expect(currencySelect.value).toBe(localeCurrency());
    });

    it('pre-fills currency from user preference when set', () => {
      useUserPreferencesStore.setState({ currency: 'GBP' });
      renderForm();
      const currencySelect = screen.getByLabelText('currency-test') as HTMLSelectElement;
      expect(currencySelect.value).toBe('GBP');
    });

    it('preserves existing transaction currency in edit mode regardless of preference', () => {
      useUserPreferencesStore.setState({ currency: 'JPY' });
      const transaction = {
        id: 'tx-1',
        description: 'Lunch',
        amount: 1200,
        currency: 'EUR',
        type: 'EXPENSE' as const,
        date: '2024-03-01',
        categoryId: 'cat-1',
      };
      renderForm({ transaction });
      const currencySelect = screen.getByLabelText('currency-test') as HTMLSelectElement;
      expect(currencySelect.value).toBe('EUR');
    });
  });

  it('creates a transaction with the selected category', async () => {
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/Add a note/i), 'New Coffee');
    await user.type(screen.getByLabelText('amount-test'), '5.50');
    await user.selectOptions(screen.getByLabelText('category-test'), 'cat-1');

    await user.click(screen.getByRole('button', { name: /Save/i }));

    expect(mockCreateTx.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'New Coffee',
        amount: 550,
        categoryId: 'cat-1',
      }),
      expect.any(Object),
    );
  });

  // Delete flow moved to TransactionsPage (trash icon in dialog header).

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

      const descInput = screen.getByPlaceholderText(/Add a note/i);
      await user.clear(descInput);

      await user.click(screen.getByRole('button', { name: /Save/i }));

      expect(mockUpdateTx.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ description: null }),
        expect.any(Object),
      );
      const calledWith = mockUpdateTx.mutate.mock.calls[0][0];
      expect(calledWith).not.toMatchObject({ description: undefined });
      expect('description' in calledWith).toBe(true);
    });

    it('sends the description value when non-empty', async () => {
      renderForm({ transaction: existingTransaction });
      const user = userEvent.setup();

      const descInput = screen.getByPlaceholderText(/Add a note/i);
      await user.clear(descInput);
      await user.type(descInput, 'New Description');

      await user.click(screen.getByRole('button', { name: /Save/i }));

      expect(mockUpdateTx.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'New Description' }),
        expect.any(Object),
      );
    });

    it('sends null for description on create when none provided', async () => {
      renderForm();
      const user = userEvent.setup();

      await user.type(screen.getByLabelText('amount-test'), '5.00');
      await user.selectOptions(screen.getByLabelText('category-test'), 'cat-1');

      await user.click(screen.getByRole('button', { name: /Save/i }));

      expect(mockCreateTx.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ description: null }),
        expect.any(Object),
      );
    });
  });

  it('forwards autoFocus to HeroAmountInput in create mode but not in edit mode', () => {
    const { unmount } = renderForm();
    expect(screen.getByLabelText('amount-test')).toHaveAttribute('data-autofocus', 'true');
    unmount();

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
    expect(screen.getByLabelText('amount-test')).toHaveAttribute('data-autofocus', 'false');
  });
});
