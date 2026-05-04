import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@/test/utils';

vi.mock('@tanstack/react-router', () => ({
  createLazyFileRoute: () => (opts: { component: React.ComponentType }) => ({ options: opts }),
}));

const mockCreateCategory = { mutate: vi.fn(), isPending: false, reset: vi.fn() };
const mockDeleteCategory = { mutate: vi.fn(), isPending: false };
const mockUpdateCategory = { mutate: vi.fn(), isPending: false, reset: vi.fn() };

vi.mock('@/hooks/useCategories', () => ({
  CATEGORIES_PAGE_SIZE: 200,
  useCategories: vi.fn(),
  useCreateCategory: () => mockCreateCategory,
  useDeleteCategory: () => mockDeleteCategory,
  useUpdateCategory: () => mockUpdateCategory,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/components/ConfirmationDialog', () => ({
  ConfirmationDialog: ({
    isOpen,
    onConfirm,
    onOpenChange,
  }: {
    isOpen: boolean;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
  }) =>
    isOpen
      ? React.createElement('div', { 'data-testid': 'confirmation-dialog' }, [
          React.createElement(
            'button',
            { key: 'confirm', type: 'button', onClick: onConfirm },
            'Confirm Delete',
          ),
          React.createElement(
            'button',
            { key: 'cancel', type: 'button', onClick: () => onOpenChange(false) },
            'Cancel',
          ),
        ])
      : null,
}));

// Stub UI primitives
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    disabled,
    type,
    onClick,
    variant,
    size,
    className,
    'aria-label': ariaLabel,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    type?: 'button' | 'submit';
    onClick?: () => void;
    variant?: string;
    size?: string;
    className?: string;
    'aria-label'?: string;
  }) =>
    React.createElement(
      'button',
      {
        disabled,
        type: type || 'button',
        onClick,
        'data-variant': variant,
        'data-size': size,
        className,
        'aria-label': ariaLabel,
      },
      children,
    ),
}));
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement('div', { className }, children),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement('div', { className }, children),
}));
vi.mock('@/components/ui/input', () => ({
  Input: ({
    value,
    onChange,
    placeholder,
    className,
    autoFocus,
    maxLength,
  }: {
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
    maxLength?: number;
  }) =>
    React.createElement('input', {
      value,
      onChange,
      placeholder,
      className,
      'data-autofocus': autoFocus,
      maxLength,
    }),
}));
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) =>
    React.createElement('div', { 'data-testid': 'skeleton', className }),
}));
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? React.createElement('div', { 'data-testid': 'dialog' }, children) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'dialog-content' }, children),
  DialogHeader: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'dialog-header' }, children),
  DialogTitle: ({ children }: { children: React.ReactNode }) =>
    React.createElement('h2', { 'data-testid': 'dialog-title' }, children),
  DialogDescription: ({ children }: { children: React.ReactNode }) =>
    React.createElement('p', { 'data-testid': 'dialog-description' }, children),
}));
vi.mock('lucide-react', () => ({
  Plus: () => React.createElement('span', null, '+'),
  Trash2: () => React.createElement('span', null, 'delete'),
  ChevronLeft: () => React.createElement('span', null, '<'),
  ChevronRight: () => React.createElement('span', null, '>'),
  Filter: () => React.createElement('span', null, 'filter'),
  X: () => React.createElement('span', null, 'x'),
  Check: () => React.createElement('span', null, 'check'),
}));

const { useCategories } = await import('@/hooks/useCategories');
const { Route } = await import('./index.lazy');
const CategoriesPage = (Route.options as { component: React.ComponentType }).component;

function renderPage() {
  return render(React.createElement(CategoriesPage));
}

describe('CategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateCategory.isPending = false;
    mockDeleteCategory.isPending = false;
    mockUpdateCategory.isPending = false;
  });

  it('shows loading skeletons while data is loading', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useCategories>);
    renderPage();
    // 6 skeleton rows, one name placeholder each
    expect(screen.getAllByTestId('skeleton')).toHaveLength(6);
  });

  it('shows an empty state message when there are no categories', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: { items: [], meta: { total: 0, size: 200, page: 0 } },
      isLoading: false,
    } as unknown as ReturnType<typeof useCategories>);
    renderPage();
    expect(screen.getByText(/no categories yet/i)).toBeInTheDocument();
  });

  it('renders a list of categories', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: {
        items: [
          { id: 'cat-1', name: 'Groceries' },
          { id: 'cat-2', name: 'Transport' },
        ],
        meta: {
          total: 2,
          size: 200,
          page: 0,
        },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useCategories>);
    renderPage();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('calls createCategory.mutate when the create form is submitted', async () => {
    vi.mocked(useCategories).mockReturnValue({
      data: { items: [], meta: { total: 0, size: 200, page: 0 } },
      isLoading: false,
    } as unknown as ReturnType<typeof useCategories>);
    renderPage();
    const user = userEvent.setup();

    // Toggle form
    const addButtons = screen.getAllByRole('button', { name: /add/i });
    await user.click(addButtons[0]);

    await user.type(screen.getByPlaceholderText(/new category name/i), 'Food');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockCreateCategory.mutate).toHaveBeenCalledWith({ name: 'Food' }, expect.any(Object));
  });

  it('does not submit create form when input is empty', async () => {
    vi.mocked(useCategories).mockReturnValue({
      data: { items: [], meta: { total: 0, size: 200, page: 0 } },
      isLoading: false,
    } as unknown as ReturnType<typeof useCategories>);
    renderPage();
    const user = userEvent.setup();

    // Toggle form
    const addButtons = screen.getAllByRole('button', { name: /add/i });
    await user.click(addButtons[0]);

    // Submit without typing anything
    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();
    expect(mockCreateCategory.mutate).not.toHaveBeenCalled();
  });

  it('enters edit mode when a category name is clicked', async () => {
    vi.mocked(useCategories).mockReturnValue({
      data: { items: [{ id: 'cat-1', name: 'Groceries' }], meta: { total: 1, size: 200, page: 0 } },
      isLoading: false,
    } as unknown as ReturnType<typeof useCategories>);
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Edit category: Groceries' }));

    // Should now show an input with the category name and Save/Cancel buttons
    expect(screen.getByDisplayValue('Groceries')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls updateCategory.mutate when the edit form is saved', async () => {
    vi.mocked(useCategories).mockReturnValue({
      data: { items: [{ id: 'cat-1', name: 'Groceries' }], meta: { total: 1, size: 200, page: 0 } },
      isLoading: false,
    } as unknown as ReturnType<typeof useCategories>);
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Edit category: Groceries' }));

    const editInput = screen.getByDisplayValue('Groceries');
    await user.clear(editInput);
    await user.type(editInput, 'Food');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockUpdateCategory.mutate).toHaveBeenCalledWith({ name: 'Food' }, expect.any(Object));
  });

  it('cancels edit mode without mutating when Cancel is clicked', async () => {
    vi.mocked(useCategories).mockReturnValue({
      data: { items: [{ id: 'cat-1', name: 'Groceries' }], meta: { total: 1, size: 200, page: 0 } },
      isLoading: false,
    } as unknown as ReturnType<typeof useCategories>);
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Edit category: Groceries' }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockUpdateCategory.mutate).not.toHaveBeenCalled();
    // The category name button should be visible again
    expect(screen.getByRole('button', { name: 'Edit category: Groceries' })).toBeInTheDocument();
  });

  it('calls deleteCategory.mutate when the delete button is clicked and confirmed', async () => {
    vi.mocked(useCategories).mockReturnValue({
      data: { items: [{ id: 'cat-1', name: 'Groceries' }], meta: { total: 1, size: 200, page: 0 } },
      isLoading: false,
    } as unknown as ReturnType<typeof useCategories>);
    renderPage();
    const user = userEvent.setup();

    // Open the edit dialog — delete now lives there, not on the row
    await user.click(screen.getByRole('button', { name: 'Edit category: Groceries' }));

    await user.click(screen.getByRole('button', { name: /delete category/i }));

    // Mutation should not be called yet
    expect(mockDeleteCategory.mutate).not.toHaveBeenCalled();

    // Confirmation dialog should be visible
    const confirmBtn = screen.getByText('Confirm Delete');
    await user.click(confirmBtn);

    expect(mockDeleteCategory.mutate).toHaveBeenCalledWith('cat-1', expect.any(Object));
  });

  it('clears input and resets mutation when Add dialog is cancelled', async () => {
    vi.mocked(useCategories).mockReturnValue({
      data: { items: [], meta: { total: 0, size: 200, page: 0 } },
      isLoading: false,
    } as unknown as ReturnType<typeof useCategories>);
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getAllByRole('button', { name: /add/i })[0]);
    await user.type(screen.getByPlaceholderText(/new category name/i), 'Unsaved');
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockCreateCategory.reset).toHaveBeenCalled();

    // Reopen — input should be empty
    await user.click(screen.getAllByRole('button', { name: /add/i })[0]);
    expect(screen.getByPlaceholderText(/new category name/i)).toHaveValue('');
  });

  it('Save button stays disabled when edit name is unchanged', async () => {
    vi.mocked(useCategories).mockReturnValue({
      data: { items: [{ id: 'cat-1', name: 'Groceries' }], meta: { total: 1, size: 200, page: 0 } },
      isLoading: false,
    } as unknown as ReturnType<typeof useCategories>);
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Edit category: Groceries' }));

    // Name unchanged — Save should be disabled
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('resets update mutation when edit dialog is cancelled', async () => {
    vi.mocked(useCategories).mockReturnValue({
      data: { items: [{ id: 'cat-1', name: 'Groceries' }], meta: { total: 1, size: 200, page: 0 } },
      isLoading: false,
    } as unknown as ReturnType<typeof useCategories>);
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Edit category: Groceries' }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockUpdateCategory.reset).toHaveBeenCalled();
  });

  it('handles autoFocus correctly in dialogs', async () => {
    vi.mocked(useCategories).mockReturnValue({
      data: {
        items: [{ id: 'cat-1', name: 'Groceries' }],
        meta: { total: 1, size: 200, page: 0 },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useCategories>);
    renderPage();
    const user = userEvent.setup();

    // Add dialog
    await user.click(screen.getByRole('button', { name: /Add/i }));
    expect(screen.getByPlaceholderText(/New category name/i)).toHaveAttribute(
      'data-autofocus',
      'true',
    );
    await user.click(screen.getByRole('button', { name: /Cancel/i }));

    // Edit dialog
    await user.click(screen.getByText('Groceries'));
    expect(screen.getByPlaceholderText(/Category name/i)).toHaveAttribute('data-autofocus', 'true');
  });
});
