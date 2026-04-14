import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  createLazyFileRoute: () => (opts: any) => ({ options: opts }),
}))

const mockCreateCategory = { mutate: vi.fn(), isPending: false }
const mockDeleteCategory = { mutate: vi.fn(), isPending: false }
const mockUpdateCategory = { mutate: vi.fn(), isPending: false }

vi.mock('@/hooks/useCategories', () => ({
  useCategories: vi.fn(),
  useCreateCategory: () => mockCreateCategory,
  useDeleteCategory: () => mockDeleteCategory,
  useUpdateCategory: () => mockUpdateCategory,
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

vi.mock('@/components/ConfirmationDialog', () => ({
  ConfirmationDialog: ({ isOpen, onConfirm, onOpenChange }: any) =>
    isOpen ? React.createElement('div', { 'data-testid': 'confirmation-dialog' }, [
      React.createElement('button', { key: 'confirm', onClick: onConfirm }, 'Confirm Delete'),
      React.createElement('button', { key: 'cancel', onClick: () => onOpenChange(false) }, 'Cancel'),
    ]) : null,
}))

// Stub UI primitives
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, disabled, type, onClick, variant, size, className }: any) =>
    React.createElement('button', { disabled, type, onClick, 'data-variant': variant, 'data-size': size, className }, children),
}))
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => React.createElement('div', { className }, children),
  CardContent: ({ children, className }: any) => React.createElement('div', { className }, children),
}))
vi.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, className, autoFocus, maxLength }: any) =>
    React.createElement('input', { value, onChange, placeholder, className, autoFocus, maxLength }),
}))
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => React.createElement('div', { 'data-testid': 'skeleton', className }),
}))
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? React.createElement('div', { 'data-testid': 'dialog' }, children) : null,
  DialogContent: ({ children }: any) => React.createElement('div', { 'data-testid': 'dialog-content' }, children),
  DialogHeader: ({ children }: any) => React.createElement('div', { 'data-testid': 'dialog-header' }, children),
  DialogTitle: ({ children }: any) => React.createElement('h2', { 'data-testid': 'dialog-title' }, children),
}))
vi.mock('lucide-react', () => ({
  Plus: () => React.createElement('span', null, '+'),
  Trash2: () => React.createElement('span', null, 'delete'),
  ChevronLeft: () => React.createElement('span', null, '<'),
  ChevronRight: () => React.createElement('span', null, '>'),
  Filter: () => React.createElement('span', null, 'filter'),
  X: () => React.createElement('span', null, 'x'),
  Check: () => React.createElement('span', null, 'check'),
}))

const { useCategories } = await import('@/hooks/useCategories')
const { Route } = await import('./index.lazy')
const CategoriesPage = Route.options.component as React.ComponentType

function renderPage() {
  return render(React.createElement(CategoriesPage))
}

describe('CategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateCategory.isPending = false
    mockDeleteCategory.isPending = false
    mockUpdateCategory.isPending = false
  })

  it('shows loading skeletons while data is loading', () => {
    vi.mocked(useCategories).mockReturnValue({ data: undefined, isLoading: true } as any)
    renderPage()
    expect(screen.getAllByTestId('skeleton')).toHaveLength(4)
  })

  it('shows an empty state message when there are no categories', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: { items: [], meta: { total: 0, size: 200, page: 0 } },
      isLoading: false,
    } as any)
    renderPage()
    expect(screen.getByText(/no categories yet/i)).toBeInTheDocument()
  })

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
    } as any)
    renderPage()
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.getByText('Transport')).toBeInTheDocument()
  })

  it('calls createCategory.mutate when the create form is submitted', async () => {
    vi.mocked(useCategories).mockReturnValue({
      data: { items: [], meta: { total: 0, size: 200, page: 0 } },
      isLoading: false,
    } as any)
    renderPage()
    const user = userEvent.setup()

    // Toggle form
    const addButtons = screen.getAllByRole('button', { name: /add/i })
    await user.click(addButtons[0])

    await user.type(screen.getByPlaceholderText(/new category name/i), 'Food')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(mockCreateCategory.mutate).toHaveBeenCalledWith(
      { name: 'Food' },
      expect.any(Object),
    )
  })

  it('does not submit create form when input is empty', async () => {
    vi.mocked(useCategories).mockReturnValue({
      data: { items: [], meta: { total: 0, size: 200, page: 0 } },
      isLoading: false,
    } as any)
    renderPage()
    const user = userEvent.setup()

    // Toggle form
    const addButtons = screen.getAllByRole('button', { name: /add/i })
    await user.click(addButtons[0])

    // Submit without typing anything
    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeDisabled()
    expect(mockCreateCategory.mutate).not.toHaveBeenCalled()
  })

  it('enters edit mode when a category name is clicked', async () => {
    vi.mocked(useCategories).mockReturnValue({
      data: { items: [{ id: 'cat-1', name: 'Groceries' }], meta: { total: 1, size: 200, page: 0 } },
      isLoading: false,
    } as any)
    renderPage()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Groceries' }))

    // Should now show an input with the category name and Save/Cancel buttons
    expect(screen.getByDisplayValue('Groceries')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('calls updateCategory.mutate when the edit form is saved', async () => {
    vi.mocked(useCategories).mockReturnValue({
      data: { items: [{ id: 'cat-1', name: 'Groceries' }], meta: { total: 1, size: 200, page: 0 } },
      isLoading: false,
    } as any)
    renderPage()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Groceries' }))

    const editInput = screen.getByDisplayValue('Groceries')
    await user.clear(editInput)
    await user.type(editInput, 'Food')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(mockUpdateCategory.mutate).toHaveBeenCalledWith(
      { name: 'Food' },
      expect.any(Object),
    )
  })

  it('cancels edit mode without mutating when Cancel is clicked', async () => {
    vi.mocked(useCategories).mockReturnValue({
      data: { items: [{ id: 'cat-1', name: 'Groceries' }], meta: { total: 1, size: 200, page: 0 } },
      isLoading: false,
    } as any)
    renderPage()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Groceries' }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(mockUpdateCategory.mutate).not.toHaveBeenCalled()
    // The category name button should be visible again
    expect(screen.getByRole('button', { name: 'Groceries' })).toBeInTheDocument()
  })

  it('calls deleteCategory.mutate when the delete button is clicked and confirmed', async () => {
    vi.mocked(useCategories).mockReturnValue({
      data: { items: [{ id: 'cat-1', name: 'Groceries' }], meta: { total: 1, size: 200, page: 0 } },
      isLoading: false,
    } as any)
    renderPage()
    const user = userEvent.setup()

    // The delete button contains the Trash2 icon text "delete"
    const deleteButtons = screen.getAllByRole('button')
    const deleteBtn = deleteButtons.find((btn) => btn.querySelector('span')?.textContent === 'delete')
    expect(deleteBtn).toBeDefined()
    await user.click(deleteBtn!)

    // Mutation should not be called yet
    expect(mockDeleteCategory.mutate).not.toHaveBeenCalled()

    // Confirmation dialog should be visible
    const confirmBtn = screen.getByText('Confirm Delete')
    await user.click(confirmBtn)

    expect(mockDeleteCategory.mutate).toHaveBeenCalledWith('cat-1', expect.any(Object))
  })
})
