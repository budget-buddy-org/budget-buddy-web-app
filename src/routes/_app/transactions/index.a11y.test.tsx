import { fireEvent, screen } from '@testing-library/react';
import 'vitest-axe/extend-expect';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { TransactionsPage } from '@/components/transactions/TransactionsPage';
import { render } from '@/test/utils';

vi.mock('@tanstack/react-router', () => ({
  createLazyFileRoute: () => (options: { component: React.ComponentType }) => ({ options }),
  createFileRoute: () => (options: unknown) => ({ options }),
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => <a href="/">{children}</a>,
}));

vi.mock('@/routes/_app/transactions/index', () => ({
  Route: {
    fullPath: '/_app/transactions/',
    useSearch: () => ({}),
  },
}));

vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({
    data: {
      items: [
        { id: '1', name: 'Food', type: 'EXPENSE', icon: 'utensils' },
        { id: '2', name: 'Salary', type: 'INCOME', icon: 'banknote' },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useTransactions', () => ({
  useTransactions: () => ({
    data: {
      items: [
        {
          id: '1',
          description: 'Grocery store',
          amount: 1250,
          type: 'EXPENSE',
          currency: 'EUR',
          date: '2024-03-20',
          categoryId: '1',
        },
      ],
      meta: {
        total: 1,
        page: 0,
        size: 20,
      },
    },
    isLoading: false,
    isFetching: false,
  }),
  useCreateTransaction: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteTransaction: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateTransaction: () => ({ mutate: vi.fn(), isPending: false }),
  useTransaction: () => ({ data: null, isLoading: false }),
  TRANSACTIONS_PAGE_SIZE: 20,
}));

describe('TransactionsPage a11y', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<TransactionsPage />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations when filters dialog is open', async () => {
    render(<TransactionsPage />);

    // Open filters dialog
    const filterButton = screen.getByLabelText(/open filters/i);
    fireEvent.click(filterButton);

    // Dialog teleports to body, so we check document.body
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
