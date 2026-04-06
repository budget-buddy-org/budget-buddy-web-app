import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDate, toMinorUnits, todayIso } from './formatters'

describe('formatCurrency', () => {
  it('converts minor units to formatted EUR string', () => {
    expect(formatCurrency(1299)).toBe('€12.99')
    expect(formatCurrency(100)).toBe('€1.00')
    expect(formatCurrency(0)).toBe('€0.00')
  })

  it('supports different currencies', () => {
    expect(formatCurrency(1000, 'USD')).toBe('$10.00')
    expect(formatCurrency(500, 'GBP')).toBe('£5.00')
  })

  it('handles large amounts', () => {
    expect(formatCurrency(100000)).toBe('€1,000.00')
  })
})

describe('toMinorUnits', () => {
  it('converts decimal to minor units', () => {
    expect(toMinorUnits(12.99)).toBe(1299)
    expect(toMinorUnits(10)).toBe(1000)
    expect(toMinorUnits(0)).toBe(0)
    expect(toMinorUnits(0.01)).toBe(1)
  })

  it('rounds floating point correctly', () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JS — Math.round must handle this
    expect(toMinorUnits(0.1 + 0.2)).toBe(30)
  })
})

describe('formatDate', () => {
  it('formats ISO date string for display', () => {
    expect(formatDate('2024-01-15')).toBe('Jan 15, 2024')
    expect(formatDate('2023-12-01')).toBe('Dec 1, 2023')
  })
})

describe('todayIso', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const result = todayIso()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns today\'s date', () => {
    const result = todayIso()
    const expected = new Date().toISOString().split('T')[0]
    expect(result).toBe(expected)
  })
})
