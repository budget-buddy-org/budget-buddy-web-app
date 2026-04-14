import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AmountInput } from './amount-input'

describe('AmountInput', () => {
  it('should format initial value', () => {
    const onChange = vi.fn()
    render(<AmountInput value="12.99" onChange={onChange} />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('12.99')
  })

  it('should implement unit-shifting logic: 1 -> 0.01', () => {
    const onChange = vi.fn()
    render(<AmountInput value="" onChange={onChange} />)
    const input = screen.getByRole('textbox') as HTMLInputElement

    fireEvent.change(input, { target: { value: '1' } })
    expect(onChange).toHaveBeenCalledWith('0.01')
  })

  it('should implement unit-shifting logic: 12 -> 0.12', () => {
    const onChange = vi.fn()
    render(<AmountInput value="0.01" onChange={onChange} />)
    const input = screen.getByRole('textbox') as HTMLInputElement

    // Adding '2' to '0.01' -> '0.012' -> digits '0012' -> '12' -> '0.12'
    fireEvent.change(input, { target: { value: '0.012' } })
    expect(onChange).toHaveBeenCalledWith('0.12')
  })

  it('should implement unit-shifting logic: 120 -> 1.20', () => {
    const onChange = vi.fn()
    render(<AmountInput value="0.12" onChange={onChange} />)
    const input = screen.getByRole('textbox') as HTMLInputElement

    fireEvent.change(input, { target: { value: '0.120' } })
    expect(onChange).toHaveBeenCalledWith('1.20')
  })

  it('should handle backspace: 1.20 -> 0.12', () => {
    const onChange = vi.fn()
    render(<AmountInput value="1.20" onChange={onChange} />)
    const input = screen.getByRole('textbox') as HTMLInputElement

    // Removing '0' from '1.20' -> '1.2' -> digits '12' -> '0.12'
    fireEvent.change(input, { target: { value: '1.2' } })
    expect(onChange).toHaveBeenCalledWith('0.12')
  })

  it('should handle empty input', () => {
    const onChange = vi.fn()
    render(<AmountInput value="0.01" onChange={onChange} />)
    const input = screen.getByRole('textbox') as HTMLInputElement

    fireEvent.change(input, { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith('')
  })
})
