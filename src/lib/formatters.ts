function browserLocale(): string {
  return (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
}

/** Converts minor currency units (e.g. 1299) to a formatted string (e.g. "€12.99"). */
export function formatCurrency(minorUnits: number, currency = 'EUR', locale?: string): string {
  return new Intl.NumberFormat(locale ?? browserLocale(), { style: 'currency', currency }).format(
    minorUnits / 100,
  );
}

/** Converts a decimal amount (e.g. 12.99) to minor units (e.g. 1299). */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

function padDatePart(value: number): string {
  return value.toString().padStart(2, '0');
}

/** Formats a Date as a local YYYY-MM-DD string. */
export function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  return `${year}-${month}-${day}`;
}

/** Formats a Date as a local YYYY-MM string. */
export function toLocalYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  return `${year}-${month}`;
}

/** Formats an ISO date string (YYYY-MM-DD) for display. */
export function formatDate(dateString: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale ?? browserLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${dateString}T00:00:00`));
}

/** Returns today's date as YYYY-MM-DD. */
export function todayIso(): string {
  return toLocalIsoDate(new Date());
}
