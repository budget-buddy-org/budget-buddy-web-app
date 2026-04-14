import type { Transaction } from '@budget-buddy-org/budget-buddy-contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionsPage } from '@/components/transactions/TransactionsPage';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  createLazyFileRoute: () => (options: { component: React.ComponentType }) => ({ options }),
  useNavigate: () => mockNavigate,
  useSearch: () => vi.fn(),
}));

vi.mock('@/hooks/useTransactions', () => ({
  useTransactions: vi.fn(),
  useTransaction: vi.fn(),
}));

vi.mock('@/hooks/useCategories', () => ({
  useCategories: vi.fn(),
}));

vi.mock('@/components/transactions/TransactionForm', () => ({
  TransactionForm: ({
    transaction,
    onSuccess,
  }: {
    transaction?: Transaction;
    onSuccess: () => void;
  }) => (
    <div data-testid="transaction-form">
      {transaction ? `Editing ${transaction.id}` : 'Adding'}
      <button type="button" onClick={onSuccess}>
        Success
      </button>
    </div>
  ),
}));

import { useCategories } from '@/hooks/useCategories';
import { useTransaction, useTransactions } from '@/hooks/useTransactions';

describe('TransactionsPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCategories).mockReturnValue({
      data: { items: [] },
      isLoading: false,
    } as unknown as ReturnType<typeof useCategories>);
    vi.mocked(useTransactions).mockReturnValue({
      data: { items: [], meta: { total: 0 } },
      isLoading: false,
    } as unknown as ReturnType<typeof useTransactions>);
    vi.mocked(useTransaction).mockReturnValue({
      data: null,
      isLoading: false,
    } as unknown as ReturnType<typeof useTransaction>);
  });

  it('opens edit dialog when clicking a transaction in the list', async () => {
    vi.mocked(useTransactions).mockReturnValue({
      data: {
        items: [
          {
            id: '123',
            description: 'Test Transaction',
            amount: 1000,
            date: '2024-01-01',
            type: 'EXPENSE',
            currency: 'EUR',
          } as Transaction,
        ],
        meta: { total: 1, size: 20, page: 0 },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useTransactions>);
    vi.mocked(useTransaction).mockReturnValue({
      data: {
        id: '123',
        description: 'Test Transaction',
        amount: 1000,
        date: '2024-01-01',
        type: 'EXPENSE',
        currency: 'EUR',
      } as Transaction,
      isLoading: false,
    } as unknown as ReturnType<typeof useTransaction>);

    render(
      <QueryClientProvider client={queryClient}>
        <TransactionsPage />
      </QueryClientProvider>,
    );

    const transactionItem = screen.getByText('Test Transaction');
    fireEvent.click(transactionItem);

    expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-form')).toHaveTextContent('Editing 123');
  });

  it('opens add dialog when clicking Add button', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TransactionsPage />
      </QueryClientProvider>,
    );

    const addButtons = screen.getAllByRole('button', { name: /add/i });
    fireEvent.click(addButtons[0]);

    expect(screen.getByText('Add Transaction')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-form')).toHaveTextContent('Adding');
  });
});
