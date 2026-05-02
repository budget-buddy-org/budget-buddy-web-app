function browserLocale(): string {
  return (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
}

// ISO 3166-1 alpha-2 region → ISO 4217 currency code
const REGION_CURRENCY: Record<string, string> = {
  AD: 'EUR',
  AT: 'EUR',
  BE: 'EUR',
  CY: 'EUR',
  DE: 'EUR',
  EE: 'EUR',
  ES: 'EUR',
  FI: 'EUR',
  FR: 'EUR',
  GR: 'EUR',
  HR: 'EUR',
  IE: 'EUR',
  IT: 'EUR',
  LT: 'EUR',
  LU: 'EUR',
  LV: 'EUR',
  MC: 'EUR',
  ME: 'EUR',
  MT: 'EUR',
  NL: 'EUR',
  PT: 'EUR',
  SI: 'EUR',
  SK: 'EUR',
  SM: 'EUR',
  VA: 'EUR',
  XK: 'EUR',
  GB: 'GBP',
  CH: 'CHF',
  NO: 'NOK',
  SE: 'SEK',
  DK: 'DKK',
  IS: 'ISK',
  PL: 'PLN',
  CZ: 'CZK',
  HU: 'HUF',
  RO: 'RON',
  BG: 'BGN',
  RS: 'RSD',
  UA: 'UAH',
  BY: 'BYN',
  RU: 'RUB',
  GE: 'GEL',
  AM: 'AMD',
  AZ: 'AZN',
  AL: 'ALL',
  BA: 'BAM',
  MK: 'MKD',
  MD: 'MDL',
  US: 'USD',
  CA: 'CAD',
  MX: 'MXN',
  BR: 'BRL',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
  PE: 'PEN',
  VE: 'VES',
  EC: 'USD',
  BO: 'BOB',
  PY: 'PYG',
  UY: 'UYU',
  CR: 'CRC',
  GT: 'GTQ',
  HN: 'HNL',
  SV: 'USD',
  NI: 'NIO',
  DO: 'DOP',
  CU: 'CUP',
  JM: 'JMD',
  TT: 'TTD',
  BB: 'BBD',
  BS: 'BSD',
  JP: 'JPY',
  CN: 'CNY',
  KR: 'KRW',
  IN: 'INR',
  SG: 'SGD',
  HK: 'HKD',
  TW: 'TWD',
  TH: 'THB',
  ID: 'IDR',
  MY: 'MYR',
  PH: 'PHP',
  VN: 'VND',
  PK: 'PKR',
  BD: 'BDT',
  LK: 'LKR',
  NP: 'NPR',
  MM: 'MMK',
  KH: 'KHR',
  LA: 'LAK',
  BN: 'BND',
  MN: 'MNT',
  KZ: 'KZT',
  UZ: 'UZS',
  AF: 'AFN',
  SA: 'SAR',
  AE: 'AED',
  IL: 'ILS',
  TR: 'TRY',
  EG: 'EGP',
  JO: 'JOD',
  IQ: 'IQD',
  IR: 'IRR',
  KW: 'KWD',
  BH: 'BHD',
  QA: 'QAR',
  OM: 'OMR',
  ZA: 'ZAR',
  NG: 'NGN',
  KE: 'KES',
  GH: 'GHS',
  MA: 'MAD',
  TN: 'TND',
  DZ: 'DZD',
  ET: 'ETB',
  TZ: 'TZS',
  UG: 'UGX',
  ZM: 'ZMW',
  AU: 'AUD',
  NZ: 'NZD',
  FJ: 'FJD',
  PG: 'PGK',
};

/** All ISO 4217 currency codes supported by the runtime, sorted alphabetically. */
export const ISO_CURRENCIES: readonly string[] = (() => {
  try {
    return Intl.supportedValuesOf('currency');
  } catch {
    return ['EUR', 'GBP', 'USD'];
  }
})();

/** Returns the ISO 4217 currency code that best matches the user's browser locale. */
export function localeCurrency(): string {
  try {
    const region = new Intl.Locale(browserLocale()).region?.toUpperCase();
    return (region && REGION_CURRENCY[region]) ?? 'EUR';
  } catch {
    return 'EUR';
  }
}

let _currencyDisplayNames: Intl.DisplayNames | null = null;
function getCurrencyDisplayNames(): Intl.DisplayNames {
  if (!_currencyDisplayNames) {
    _currencyDisplayNames = new Intl.DisplayNames([browserLocale()], { type: 'currency' });
  }
  return _currencyDisplayNames;
}

/** Returns "EUR — Euro" style label for a currency code. */
export function currencyLabel(code: string): string {
  try {
    const name = getCurrencyDisplayNames().of(code);
    return name ? `${code} — ${name}` : code;
  } catch {
    return code;
  }
}

const currencyFormatters = new Map<string, Intl.NumberFormat>();
const dateFormatters = new Map<string, Intl.DateTimeFormat>();

function getCurrencyFormatter(locale: string, currency: string): Intl.NumberFormat {
  const key = `${locale}|${currency}`;
  let f = currencyFormatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, { style: 'currency', currency });
    currencyFormatters.set(key, f);
  }
  return f;
}

function getDateFormatter(locale: string): Intl.DateTimeFormat {
  let f = dateFormatters.get(locale);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });
    dateFormatters.set(locale, f);
  }
  return f;
}

/** Converts minor currency units (e.g. 1299) to a formatted string (e.g. "€12.99"). */
export function formatCurrency(minorUnits: number, currency = 'EUR', locale?: string): string {
  return getCurrencyFormatter(locale ?? browserLocale(), currency).format(minorUnits / 100);
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
  return getDateFormatter(locale ?? browserLocale()).format(new Date(`${dateString}T00:00:00`));
}

/** Returns today's date as YYYY-MM-DD. */
export function todayIso(): string {
  return toLocalIsoDate(new Date());
}
