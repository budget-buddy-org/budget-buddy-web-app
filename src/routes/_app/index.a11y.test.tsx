import 'vitest-axe/extend-expect';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { DashboardPage } from '@/components/dashboard/DashboardPage';
import { render } from '@/test/utils';

vi.mock('@tanstack/react-router', () => ({
  createLazyFileRoute: () => (options: { component: React.ComponentType }) => ({ options }),
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children: React.ReactNode }) => <a href="/">{children}</a>,
}));

vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({
    data: {
      items: [
        { id: '1', name: 'Test Category' },
        { id: '2', name: 'Other' },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useCategoriesSummary', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useCategoriesSummary')>()),
  useCategoriesSummary: () => ({
    data: { month: '2024-03', currency: 'EUR', items: [] },
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useMonthlySummariesRange', () => ({
  useMonthlySummariesRange: () => ({ data: [], isLoading: false, isFetching: false }),
}));

vi.mock('@/hooks/useTransactions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useTransactions')>()),
  useTransactions: () => ({
    data: {
      items: [
        {
          id: '1',
          description: 'Test income',
          amount: 10000,
          type: 'INCOME',
          currency: 'EUR',
          date: '2024-03-20',
          categoryId: '1',
        },
        {
          id: '2',
          description: 'Test expense',
          amount: 5000,
          type: 'EXPENSE',
          currency: 'EUR',
          date: '2024-03-21',
          categoryId: '2',
        },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useMonthlySummary', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useMonthlySummary')>()),
  useMonthlySummary: () => ({
    data: {
      month: '2024-03',
      currency: 'EUR',
      income: 10000,
      expense: 5000,
      balance: 5000,
      incomeCount: 1,
      expenseCount: 1,
      excludedTransactionCount: 0,
    },
    isLoading: false,
  }),
}));

describe('DashboardPage a11y', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<DashboardPage />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
