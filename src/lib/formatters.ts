/** Converts minor currency units (e.g. 1299) to a formatted string (e.g. "€12.99"). */
export function formatCurrency(minorUnits: number, currency = 'EUR', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minorUnits / 100)
}

/** Converts a decimal amount (e.g. 12.99) to minor units (e.g. 1299). */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100)
}

/** Formats an ISO date string (YYYY-MM-DD) for display. */
export function formatDate(dateString: string, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(
    new Date(`${dateString}T00:00:00`),
  )
}

/** Returns today's date as YYYY-MM-DD. */
export function todayIso(): string {
  return new Date().toISOString().split('T')[0]!
}
