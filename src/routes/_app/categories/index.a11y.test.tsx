import 'vitest-axe/extend-expect';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { CategoriesPage } from '@/components/categories/CategoriesPage';
import { render } from '@/test/utils';

vi.mock('@tanstack/react-router', () => ({
  createLazyFileRoute: () => (options: { component: React.ComponentType }) => ({ options }),
}));

vi.mock('@/hooks/useCategories', () => ({
  CATEGORIES_PAGE_SIZE: 200,
  useCategories: () => ({
    data: {
      items: [
        { id: '1', name: 'Food' },
        { id: '2', name: 'Transport' },
      ],
    },
    isLoading: false,
  }),
  useCreateCategory: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteCategory: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateCategory: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('CategoriesPage a11y', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<CategoriesPage />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
