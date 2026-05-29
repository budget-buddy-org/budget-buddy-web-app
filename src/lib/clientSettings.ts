import type { DateFormatStyle } from '@/lib/formatters';
import { applyTheme, type Theme, useThemeStore } from '@/stores/theme.store';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';

/**
 * The `clientId` this web app uses to scope its per-client settings on the server.
 * Other clients (mobile, telegram bot) own their own rows under different ids.
 */
export const WEB_CLIENT_ID = 'web';

/**
 * The persisted appearance + preference fields this client syncs to the server.
 * Mirrors the persisted slices of the theme and user-preferences Zustand stores.
 * The server treats this as an opaque blob — this module owns its schema.
 */
export interface WebClientSettings {
  // theme store
  theme: Theme;
  primaryHue: number;
  fontSize: number;
  showNavLabels: boolean;
  glassEffect: boolean;
  showDescriptions: boolean;
  // user-preferences store
  currency: string | null;
  dateFormat: DateFormatStyle;
  numberLocale: string | null;
  isBalanceHidden: boolean;
}

const THEMES: readonly Theme[] = ['light', 'dark', 'system'];
const DATE_FORMATS: readonly DateFormatStyle[] = ['short', 'medium', 'long'];

/** Read the current persisted settings from both stores into a single object. */
export function collectWebSettings(): WebClientSettings {
  const t = useThemeStore.getState();
  const p = useUserPreferencesStore.getState();
  return {
    theme: t.theme,
    primaryHue: t.primaryHue,
    fontSize: t.fontSize,
    showNavLabels: t.showNavLabels,
    glassEffect: t.glassEffect,
    showDescriptions: t.showDescriptions,
    currency: p.currency,
    dateFormat: p.dateFormat,
    numberLocale: p.numberLocale,
    isBalanceHidden: p.isBalanceHidden,
  };
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const inRange = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

/**
 * Validate an opaque server payload and merge it onto the current settings.
 * Unknown or malformed fields are dropped (the server does not validate the
 * shape, so we must), leaving the current local value untouched for that field.
 */
export function parseWebSettings(raw: unknown): WebClientSettings {
  const current = collectWebSettings();
  if (!raw || typeof raw !== 'object') return current;

  const obj = raw as Record<string, unknown>;
  const next: WebClientSettings = { ...current };
  if (isString(obj.theme) && (THEMES as readonly string[]).includes(obj.theme)) {
    next.theme = obj.theme as Theme;
  }
  if (inRange(obj.primaryHue, 0, 360)) next.primaryHue = obj.primaryHue;
  if (inRange(obj.fontSize, 12, 24)) next.fontSize = obj.fontSize;
  if (isBool(obj.showNavLabels)) next.showNavLabels = obj.showNavLabels;
  if (isBool(obj.glassEffect)) next.glassEffect = obj.glassEffect;
  if (isBool(obj.showDescriptions)) next.showDescriptions = obj.showDescriptions;
  if (obj.currency === null || isString(obj.currency)) next.currency = obj.currency;
  if (isString(obj.dateFormat) && (DATE_FORMATS as readonly string[]).includes(obj.dateFormat)) {
    next.dateFormat = obj.dateFormat as DateFormatStyle;
  }
  if (obj.numberLocale === null || isString(obj.numberLocale)) next.numberLocale = obj.numberLocale;
  if (isBool(obj.isBalanceHidden)) next.isBalanceHidden = obj.isBalanceHidden;
  return next;
}

/**
 * Write validated settings into both stores and apply the visual changes once.
 * Uses `setState` rather than the individual setters so `applyTheme` runs a
 * single time instead of once per field.
 */
export function applyWebSettings(settings: WebClientSettings): void {
  useThemeStore.setState({
    theme: settings.theme,
    primaryHue: settings.primaryHue,
    fontSize: settings.fontSize,
    showNavLabels: settings.showNavLabels,
    glassEffect: settings.glassEffect,
    showDescriptions: settings.showDescriptions,
  });
  useUserPreferencesStore.setState({
    currency: settings.currency,
    dateFormat: settings.dateFormat,
    numberLocale: settings.numberLocale,
    isBalanceHidden: settings.isBalanceHidden,
  });
  applyTheme(settings.theme, settings.primaryHue, settings.fontSize);
}
