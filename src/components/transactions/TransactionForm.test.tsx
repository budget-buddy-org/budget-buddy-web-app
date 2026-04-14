import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TransactionForm } from './TransactionForm'

const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

const mockCreateTx = { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, error: null }
const mockUpdateTx = { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, error: null }
const mockDeleteTx = { mutate: vi.fn(), isPending: false }
vi.mock('@/hooks/useTransactions', () => ({
  useCreateTransaction: () => mockCreateTx,
  useUpdateTransaction: () => mockUpdateTx,
  useDeleteTransaction: () => mockDeleteTx,
}))

const mockCreateCategory = { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, error: null }
vi.mock('@/hooks/useCategories', () => ({
  useCreateCategory: () => mockCreateCategory,
}))

// Mock UI components to simplify testing
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type, loading }: any) =>
    React.createElement('button', { onClick, disabled: disabled || loading, type }, children),
}))
vi.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, autoFocus }: any) =>
    React.createElement('input', { value, onChange, placeholder, 'data-autofocus': autoFocus }),
}))
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onChange }: any) =>
    React.createElement('select', { value, onChange }, children),
}))
vi.mock('@/components/ui/amount-input', () => ({
  AmountInput: ({ value, onChange }: any) =>
    React.createElement('input', { type: 'number', value, onChange: (e: any) => onChange(e.target.value) }),
}))
vi.mock('@/components/ui/date-picker', () => ({
  DatePicker: ({ value, onChange }: any) =>
    React.createElement('input', { type: 'date', value, onChange: (e: any) => onChange({ target: { value: e.target.value } }) }),
}))
vi.mock('@/components/ui/transaction-type-toggle', () => ({
  TransactionTypeToggle: ({ value, onChange }: any) =>
    React.createElement('div', {}, 
      React.createElement('button', { onClick: () => onChange('EXPENSE'), 'aria-pressed': value === 'EXPENSE' }, 'Expense'),
      React.createElement('button', { onClick: () => onChange('INCOME'), 'aria-pressed': value === 'INCOME' }, 'Income'),
    ),
}))

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => React.createElement('div', {}, children),
  DropdownMenuTrigger: ({ children }: any) => React.createElement('div', {}, children),
  DropdownMenuContent: ({ children }: any) => React.createElement('div', {}, children),
  DropdownMenuItem: ({ children, onClick }: any) => React.createElement('button', { onClick }, children),
}))

vi.mock('@/components/ConfirmationDialog', () => ({
  ConfirmationDialog: ({ isOpen, onConfirm, title }: any) => 
    isOpen ? React.createElement('div', {}, 
      React.createElement('span', {}, title),
      React.createElement('button', { onClick: onConfirm }, 'Confirm Delete')
    ) : null,
}))

const categories = [
  { id: 'cat-1', name: 'Food' },
  { id: 'cat-2', name: 'Transport' },
]

function renderForm(props = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    React.createElement(QueryClientProvider, { client: qc },
      React.createElement(TransactionForm, {
        categories,
        onSuccess: vi.fn(),
        onCancel: vi.fn(),
        ...props
      } as any),
    ),
  )
}

describe('TransactionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateTx.isPending = false
    mockCreateTx.error = null
    mockCreateCategory.isPending = false
    mockCreateCategory.error = null
  })

  it('renders correctly', () => {
    renderForm()
    expect(screen.getByText(/^Category/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add new/i })).toBeInTheDocument()
  })

  it('toggles between existing and new category', async () => {
    renderForm()
    const user = userEvent.setup()

    const addBtn = screen.getByRole('button', { name: /Add new/i })
    await user.click(addBtn)

    expect(screen.getByPlaceholderText(/New category name/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Choose existing/i })).toBeInTheDocument()

    const backBtn = screen.getByRole('button', { name: /Choose existing/i })
    await user.click(backBtn)

    expect(screen.queryByPlaceholderText(/New category name/i)).not.toBeInTheDocument()
  })

  it('creates a new category then creates transaction', async () => {
    const onSuccess = vi.fn()
    renderForm({ onSuccess })
    const user = userEvent.setup()

    // Fill other fields
    await user.type(screen.getByPlaceholderText(/Coffee/i), 'New Coffee')
    const amountInput = screen.getAllByRole('spinbutton')[0] // AmountInput is mocked as number input
    await user.type(amountInput, '5.50')

    // Toggle to new category
    await user.click(screen.getByRole('button', { name: /Add new/i }))
    await user.type(screen.getByPlaceholderText(/New category name/i), 'Drinks')

    // Mock category creation
    mockCreateCategory.mutateAsync.mockResolvedValueOnce({ id: 'cat-new', name: 'Drinks' })

    // Click Save
    await user.click(screen.getByRole('button', { name: /Save/i }))

    await waitFor(() => expect(mockCreateCategory.mutateAsync).toHaveBeenCalledWith({ name: 'Drinks' }))
    await waitFor(() => expect(mockCreateTx.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'New Coffee',
        amount: 550,
        categoryId: 'cat-new',
      }),
      expect.any(Object)
    ))
  })

  it('shows delete confirmation and deletes transaction', async () => {
    const onSuccess = vi.fn()
    const transaction = { id: 'tx-1', description: 'Old Coffee', amount: 500, currency: 'EUR', type: 'EXPENSE', date: '2024-01-01' }
    renderForm({ onSuccess, transaction })
    const user = userEvent.setup()

    // Open dropdown and click Remove
    await user.click(screen.getByText(/Remove/i))

    // Check if confirmation dialog is shown
    expect(screen.getByText(/Delete Transaction/i)).toBeInTheDocument()

    // Confirm delete
    await user.click(screen.getByText(/Confirm Delete/i))

    expect(mockDeleteTx.mutate).toHaveBeenCalledWith('tx-1', expect.any(Object))
  })

  it('handles autoFocus based on mode', () => {
    const { unmount } = renderForm()
    const createInput = screen.getByPlaceholderText(/Coffee/i)
    expect(createInput).toHaveAttribute('data-autofocus', 'true')
    unmount()

    const transaction = { id: 'tx-1', description: 'Old Coffee', amount: 500, currency: 'EUR', type: 'EXPENSE', date: '2024-01-01' }
    renderForm({ transaction })
    const editInput = screen.getByPlaceholderText(/Coffee/i)
    expect(editInput).toHaveAttribute('data-autofocus', 'false')
  })
})
