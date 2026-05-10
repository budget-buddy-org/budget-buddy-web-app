import { useNavigate } from '@tanstack/react-router';
import { fireEvent, screen, within } from '@testing-library/react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from '@/components/dashboard/DashboardPage';
import { render } from '@/test/utils';

vi.mock('@tanstack/react-router', () => ({
  createLazyFileRoute: () => (options: { component: React.ComponentType }) => ({ options }),
  useNavigate: vi.fn(),
  Link: ({ children }: { children: React.ReactNode }) => <a href="/">{children}</a>,
}));

vi.mock('@/hooks/useTransactions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useTransactions')>()),
  useTransactions: vi.fn(),
}));

vi.mock('@/hooks/useCategoriesSummary', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useCategoriesSummary')>()),
  useCategoriesSummary: vi.fn(),
}));

vi.mock('@/hooks/useMonthlySummary', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useMonthlySummary')>()),
  useMonthlySummary: vi.fn(),
}));

vi.mock('@/hooks/useMonthlySummariesRange', () => ({
  useMonthlySummariesRange: vi.fn(),
}));

vi.mock('@/hooks/useDashboardPeriod', () => ({
  useDashboardPeriod: () => ({
    year: 2026,
    month: 3,
    currentYear: 2026,
    currentMonth: 3,
    isCurrent: true,
    setPeriod: vi.fn(),
  }),
}));

import { useCategoriesSummary } from '@/hooks/useCategoriesSummary';
import { useMonthlySummariesRange } from '@/hooks/useMonthlySummariesRange';
import { useMonthlySummary } from '@/hooks/useMonthlySummary';
import { useTransactions } from '@/hooks/useTransactions';

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

const mockMonthlySummary = {
  month: '2026-04',
  currency: 'EUR',
  income: 10000,
  expense: 5000,
  balance: 5000,
  incomeCount: 1,
  expenseCount: 1,
  excludedTransactionCount: 0,
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-14'));
    vi.clearAllMocks();

    vi.mocked(useCategoriesSummary).mockReturnValue({
      data: {
        month: '2026-04',
        currency: 'EUR',
        items: [
          {
            categoryId: '2',
            categoryName: 'Transport',
            monthlyBudget: 10000,
            spent: 5000,
            transactionCount: 1,
            excludedTransactionCount: 0,
          },
        ],
      },
      isLoading: false,
    } as ReturnType<typeof useCategoriesSummary>);

    vi.mocked(useTransactions).mockReturnValue({
      data: { items: [], meta: { total: 0, size: 5, page: 0 } },
      isLoading: false,
    } as unknown as ReturnType<typeof useTransactions>);

    vi.mocked(useMonthlySummary).mockReturnValue({
      data: mockMonthlySummary,
      isLoading: false,
    } as ReturnType<typeof useMonthlySummary>);

    vi.mocked(useMonthlySummariesRange).mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows income, expense and balance totals for the month', async () => {
    render(<DashboardPage />);

    // mockMonthlySummary: 10000 income, 5000 expense, 5000 balance (all minor units → €100/€50/€50)

    const incomeCard = screen.getByText('Income').closest('.rounded-lg');
    expect(incomeCard).toHaveTextContent(/100/);

    const expenseCard = screen.getByText('Expenses').closest('.rounded-lg');
    expect(expenseCard).toHaveTextContent(/50/);

    const balanceCard = screen.getByText('Balance').closest('.rounded-lg');
    expect(balanceCard).toHaveTextContent(/50/);
  });

  it('navigates to transaction list on click', async () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useTransactions).mockReturnValue({
      data: { items: mockTransactions, meta: { total: 2, size: 5, page: 0 } },
      isLoading: false,
    } as unknown as ReturnType<typeof useTransactions>);

    render(<DashboardPage />);

    const transactionItem = screen.getByText('Income this month');
    fireEvent.click(transactionItem);

    expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ to: '/transactions' }));
  });

  it('renders summary rows with budget progress and the spent / budget label', async () => {
    render(<DashboardPage />);

    expect(screen.getByText('Transport')).toBeInTheDocument();
    // 5000 / 10000 minor units → "€50.00 / €100.00"
    // Appears twice: once on the category row, once in the "Total budget" footer.
    expect(screen.getAllByText(/50\.00.*100\.00/)).toHaveLength(2);
    expect(screen.getByText('Total budget')).toBeInTheDocument();
  });

  it('shows the excluded-transactions note when monthly excludedTransactionCount > 0', async () => {
    vi.mocked(useMonthlySummary).mockReturnValue({
      data: { ...mockMonthlySummary, excludedTransactionCount: 3 },
      isLoading: false,
    } as ReturnType<typeof useMonthlySummary>);

    render(<DashboardPage />);

    expect(screen.getByText(/3 transactions in other currencies not shown/i)).toBeInTheDocument();
  });

  it('toggles privacy blur when tapping the balance card', async () => {
    render(<DashboardPage />);

    const balanceCard = screen.getByText('Balance').closest('.rounded-lg') as HTMLElement;
    const incomeCard = screen.getByText('Income').closest('.rounded-lg') as HTMLElement;
    const expenseCard = screen.getByText('Expenses').closest('.rounded-lg') as HTMLElement;

    expect(balanceCard).toBeInTheDocument();
    expect(incomeCard).toBeInTheDocument();
    expect(expenseCard).toBeInTheDocument();

    // Initially not blurred
    expect(within(balanceCard).getByText(/50/)).not.toHaveClass('privacy-blur');
    expect(within(incomeCard).getByText(/100/)).not.toHaveClass('privacy-blur');

    // Tap balance card
    fireEvent.click(balanceCard);

    // Now blurred
    expect(within(balanceCard).getByText(/50/)).toHaveClass('privacy-blur');
    expect(within(incomeCard).getByText(/100/)).toHaveClass('privacy-blur');
    expect(within(expenseCard).getByText(/50/)).toHaveClass('privacy-blur');

    // Tap again to unblur
    fireEvent.click(balanceCard);
    expect(within(balanceCard).getByText(/50/)).not.toHaveClass('privacy-blur');
  });
});
