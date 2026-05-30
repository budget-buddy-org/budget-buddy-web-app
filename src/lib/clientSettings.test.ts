import { beforeEach, describe, expect, it } from 'vitest';
import { useThemeStore } from '@/stores/theme.store';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';
import {
  applyWebSettings,
  collectWebSettings,
  parseWebSettings,
  WEB_CLIENT_ID,
} from './clientSettings';

const themeDefaults = {
  theme: 'system' as const,
  primaryHue: 240,
  fontSize: 16,
  showNavLabels: true,
  glassEffect: true,
  showDescriptions: true,
};

const prefDefaults = {
  currency: null,
  dateFormat: 'medium' as const,
  numberLocale: null,
  isBalanceHidden: false,
};

beforeEach(() => {
  useThemeStore.setState(themeDefaults);
  useUserPreferencesStore.setState(prefDefaults);
});

describe('WEB_CLIENT_ID', () => {
  it('is the conventional web client id', () => {
    expect(WEB_CLIENT_ID).toBe('web');
  });
});

describe('collectWebSettings', () => {
  it('reads the persisted slices of both stores', () => {
    useThemeStore.setState({ theme: 'dark', primaryHue: 120, fontSize: 18 });
    useUserPreferencesStore.setState({ currency: 'EUR', isBalanceHidden: true });

    expect(collectWebSettings()).toEqual({
      ...themeDefaults,
      ...prefDefaults,
      theme: 'dark',
      primaryHue: 120,
      fontSize: 18,
      currency: 'EUR',
      isBalanceHidden: true,
    });
  });
});

describe('parseWebSettings', () => {
  it('returns current settings when payload is empty', () => {
    expect(parseWebSettings(undefined)).toEqual(collectWebSettings());
    expect(parseWebSettings({})).toEqual(collectWebSettings());
  });

  it('accepts valid fields', () => {
    const parsed = parseWebSettings({
      theme: 'dark',
      primaryHue: 200,
      fontSize: 14,
      showNavLabels: false,
      glassEffect: false,
      showDescriptions: false,
      currency: 'USD',
      dateFormat: 'long',
      numberLocale: 'en-GB',
      isBalanceHidden: true,
    });
    expect(parsed).toEqual({
      theme: 'dark',
      primaryHue: 200,
      fontSize: 14,
      showNavLabels: false,
      glassEffect: false,
      showDescriptions: false,
      currency: 'USD',
      dateFormat: 'long',
      numberLocale: 'en-GB',
      isBalanceHidden: true,
    });
  });

  it('accepts explicit null for nullable fields', () => {
    useUserPreferencesStore.setState({ currency: 'EUR', numberLocale: 'de-DE' });
    const parsed = parseWebSettings({ currency: null, numberLocale: null });
    expect(parsed.currency).toBeNull();
    expect(parsed.numberLocale).toBeNull();
  });

  it('drops malformed fields, keeping current values', () => {
    const parsed = parseWebSettings({
      theme: 'neon',
      primaryHue: 999,
      fontSize: 4,
      dateFormat: 'epoch',
      showNavLabels: 'yes',
    });
    expect(parsed.theme).toBe('system');
    expect(parsed.primaryHue).toBe(240);
    expect(parsed.fontSize).toBe(16);
    expect(parsed.dateFormat).toBe('medium');
    expect(parsed.showNavLabels).toBe(true);
  });

  it('accepts hue/font at their inclusive bounds and drops out-of-range values', () => {
    expect(parseWebSettings({ primaryHue: 0, fontSize: 12 })).toMatchObject({
      primaryHue: 0,
      fontSize: 12,
    });
    expect(parseWebSettings({ primaryHue: 360, fontSize: 24 })).toMatchObject({
      primaryHue: 360,
      fontSize: 24,
    });
    expect(parseWebSettings({ primaryHue: 361, fontSize: 25 })).toMatchObject({
      primaryHue: 240,
      fontSize: 16,
    });
  });
});

describe('applyWebSettings', () => {
  it('writes settings into both stores', () => {
    applyWebSettings({
      theme: 'light',
      primaryHue: 30,
      fontSize: 20,
      showNavLabels: false,
      glassEffect: false,
      showDescriptions: false,
      currency: 'GBP',
      dateFormat: 'short',
      numberLocale: 'fr-FR',
      isBalanceHidden: true,
    });

    expect(useThemeStore.getState()).toMatchObject({
      theme: 'light',
      primaryHue: 30,
      fontSize: 20,
      showNavLabels: false,
    });
    expect(useUserPreferencesStore.getState()).toMatchObject({
      currency: 'GBP',
      dateFormat: 'short',
      numberLocale: 'fr-FR',
      isBalanceHidden: true,
    });
  });

  it('round-trips through collect/parse/apply', () => {
    useThemeStore.setState({ theme: 'dark', primaryHue: 99 });
    useUserPreferencesStore.setState({ currency: 'JPY' });
    const snapshot = collectWebSettings();

    // reset, then re-apply the parsed snapshot
    useThemeStore.setState(themeDefaults);
    useUserPreferencesStore.setState(prefDefaults);
    applyWebSettings(parseWebSettings(snapshot));

    expect(collectWebSettings()).toEqual(snapshot);
  });
});
