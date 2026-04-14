import { render, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { VersionCheck } from './VersionCheck'
import { useToast } from '@/hooks/use-toast'

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}))

// Mock __APP_VERSION__
const APP_VERSION = '2.8.0'
vi.stubGlobal('__APP_VERSION__', APP_VERSION)

describe('VersionCheck', () => {
  const mockToast = vi.fn()
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
      toasts: [],
      dismiss: vi.fn(),
    })
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('should not show toast if version is the same', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: APP_VERSION }),
    })

    render(<VersionCheck />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    expect(mockToast).not.toHaveBeenCalled()
  })

  it('should show toast if version is different', async () => {
    const newVersion = '2.9.0'
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: newVersion }),
    })

    render(<VersionCheck />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Update Available',
        description: expect.stringContaining(newVersion),
      })
    )
  })

  it('should periodically check for updates', async () => {
    vi.useFakeTimers()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ version: APP_VERSION }),
    })

    render(<VersionCheck />)

    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

    // Fast-forward 5 minutes
    vi.advanceTimersByTime(1000 * 60 * 5)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
