import { render } from '@testing-library/react';
import 'vitest-axe/extend-expect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { DashboardPage } from '@/components/dashboard/DashboardPage';

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

vi.mock('@/hooks/useTransactions', () => {
  const mockData = {
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
  };
  return {
    useTransactions: () => mockData,
    useAllTransactions: () => mockData,
  };
});

describe('DashboardPage a11y', () => {
  it('should have no accessibility violations', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
