import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from '@/components/dashboard/DashboardPage';

vi.mock('@tanstack/react-router', () => ({
  createLazyFileRoute: () => (options: { component: React.ComponentType }) => ({ options }),
  useNavigate: vi.fn(),
  Link: ({ children }: { children: React.ReactNode }) => <a href="/">{children}</a>,
}));

vi.mock('@/hooks/useTransactions', () => ({
  useAllTransactions: vi.fn(),
}));

vi.mock('@/hooks/useCategories', () => ({
  useCategories: vi.fn(),
}));

import { useCategories } from '@/hooks/useCategories';
import { useAllTransactions } from '@/hooks/useTransactions';

const mockTransactions = [
  {
    id: '1',
    description: 'Income this month',
    amount: 10000,
    type: 'INCOME',
    currency: 'EUR',
    date: '2026-04-10',
    categoryId: '1',
  },
  {
    id: '2',
    description: 'Expense this month',
    amount: 5000,
    type: 'EXPENSE',
    currency: 'EUR',
    date: '2026-04-11',
    categoryId: '2',
  },
];

describe('DashboardPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-14'));
    vi.clearAllMocks();

    vi.mocked(useCategories).mockReturnValue({
      data: {
        items: [
          { id: '1', name: 'Food' },
          { id: '2', name: 'Transport' },
        ],
      },
      isLoading: false,
    } as ReturnType<typeof useCategories>);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows income, expense and balance totals for the month', async () => {
    vi.mocked(useAllTransactions).mockReturnValue({
      data: {
        items: mockTransactions,
      },
      isLoading: false,
    } as ReturnType<typeof useAllTransactions>);

    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>,
    );

    // Items: 10000 income, 5000 expense. Balance = 50.00

    // Income card
    const incomeCard = screen.getByText('Income').closest('.rounded-lg');
    expect(incomeCard).toHaveTextContent(/100/);

    // Expense card
    const expenseCard = screen.getByText('Expenses').closest('.rounded-lg');
    expect(expenseCard).toHaveTextContent(/50/);

    // Balance card
    const balanceCard = screen.getByText('Balance').closest('.rounded-lg');
    expect(balanceCard).toHaveTextContent(/50/);
  });

  it('navigates to transaction list on click', async () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useAllTransactions).mockReturnValue({
      data: {
        items: mockTransactions,
      },
      isLoading: false,
    } as ReturnType<typeof useAllTransactions>);

    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>,
    );

    const transactionItem = screen.getByText('Income this month');
    fireEvent.click(transactionItem);

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/transactions',
    });
  });
});
