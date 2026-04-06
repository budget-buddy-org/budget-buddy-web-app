import { render, screen, act, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

vi.mock('@/lib/error-logger', () => ({
  logError: vi.fn(),
}))

const { logError } = await import('@/lib/error-logger')

// A component that throws when `shouldThrow` is true
function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('test explosion')
  return <div>safe content</div>
}

// Suppress React's console.error noise during intentional throws
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('safe content')).toBeInTheDocument()
  })

  it('renders default fallback and logs the error when a child throws', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('test explosion')).toBeInTheDocument()
    expect(logError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ source: 'ErrorBoundary' }),
    )

    // "Try again" button exists and resets the boundary
    const btn = screen.getByRole('button', { name: /try again/i })
    expect(btn).toBeInTheDocument()

    rerender(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    )
    act(() => { fireEvent.click(btn) })

    expect(screen.getByText('safe content')).toBeInTheDocument()
  })

  it('renders a custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={(err) => <p>custom: {err.message}</p>}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('custom: test explosion')).toBeInTheDocument()
  })

  it('resets and shows children again after clicking Try again', () => {
    // Use the custom fallback to get access to the reset callback
    let capturedReset: (() => void) | null = null

    const { rerender } = render(
      <ErrorBoundary fallback={(_, reset) => { capturedReset = reset; return <p>error ui</p> }}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('error ui')).toBeInTheDocument()
    expect(capturedReset).not.toBeNull()

    // Re-render with a non-throwing child, then call reset so the boundary clears error state
    rerender(
      <ErrorBoundary fallback={(_, reset) => { capturedReset = reset; return <p>error ui</p> }}>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    )
    act(() => { capturedReset!() })

    expect(screen.getByText('safe content')).toBeInTheDocument()
  })
})
