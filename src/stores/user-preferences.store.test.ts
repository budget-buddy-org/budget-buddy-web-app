import { beforeEach, describe, expect, it } from 'vitest';
import { useUserPreferencesStore } from './user-preferences.store';

const DEFAULTS = { currency: null, dateFormat: 'medium' as const, numberLocale: null };

describe('useUserPreferencesStore', () => {
  beforeEach(() => {
    useUserPreferencesStore.setState(DEFAULTS);
  });

  describe('defaults', () => {
    it('currency is null (auto — derive from locale)', () => {
      expect(useUserPreferencesStore.getState().currency).toBeNull();
    });

    it('dateFormat is medium (preserves existing display behaviour)', () => {
      expect(useUserPreferencesStore.getState().dateFormat).toBe('medium');
    });

    it('numberLocale is null (auto — derive from browser locale)', () => {
      expect(useUserPreferencesStore.getState().numberLocale).toBeNull();
    });
  });

  describe('setCurrency', () => {
    it('sets an explicit ISO 4217 currency code', () => {
      useUserPreferencesStore.getState().setCurrency('USD');
      expect(useUserPreferencesStore.getState().currency).toBe('USD');
    });

    it('accepts null to restore auto behaviour', () => {
      useUserPreferencesStore.getState().setCurrency('GBP');
      useUserPreferencesStore.getState().setCurrency(null);
      expect(useUserPreferencesStore.getState().currency).toBeNull();
    });
  });

  describe('setDateFormat', () => {
    it('sets short style', () => {
      useUserPreferencesStore.getState().setDateFormat('short');
      expect(useUserPreferencesStore.getState().dateFormat).toBe('short');
    });

    it('sets long style', () => {
      useUserPreferencesStore.getState().setDateFormat('long');
      expect(useUserPreferencesStore.getState().dateFormat).toBe('long');
    });

    it('resets back to medium', () => {
      useUserPreferencesStore.getState().setDateFormat('short');
      useUserPreferencesStore.getState().setDateFormat('medium');
      expect(useUserPreferencesStore.getState().dateFormat).toBe('medium');
    });
  });

  describe('setNumberLocale', () => {
    it('sets a BCP 47 locale tag', () => {
      useUserPreferencesStore.getState().setNumberLocale('de-DE');
      expect(useUserPreferencesStore.getState().numberLocale).toBe('de-DE');
    });

    it('accepts null to restore auto behaviour', () => {
      useUserPreferencesStore.getState().setNumberLocale('fr-FR');
      useUserPreferencesStore.getState().setNumberLocale(null);
      expect(useUserPreferencesStore.getState().numberLocale).toBeNull();
    });
  });

  it('stores each preference independently', () => {
    useUserPreferencesStore.getState().setCurrency('JPY');
    useUserPreferencesStore.getState().setDateFormat('short');
    useUserPreferencesStore.getState().setNumberLocale('ja-JP');

    const { currency, dateFormat, numberLocale } = useUserPreferencesStore.getState();
    expect(currency).toBe('JPY');
    expect(dateFormat).toBe('short');
    expect(numberLocale).toBe('ja-JP');
  });
});
