import { describe, expect, it } from 'vitest';
import { getApiError } from './api-error';

describe('getApiError', () => {
  it('returns the value when it is a Problem-shaped plain object', () => {
    const problem = {
      title: 'Validation failed',
      status: 400,
      detail: 'Amount is required',
      errors: [{ field: 'amount', message: 'Required' }],
    };
    expect(getApiError(problem)).toBe(problem);
  });

  it('returns the value when it is a plain object without status/title (network-style)', () => {
    // Pre-parse mutation errors can come through as bare objects; we still want to
    // return them so callers can inspect arbitrary fields.
    const bare = { foo: 'bar' };
    expect(getApiError(bare)).toBe(bare);
  });

  it('returns the value when an Error instance also carries Problem fields', () => {
    const err = Object.assign(new Error('Bad request'), {
      status: 400,
      title: 'Validation failed',
    });
    expect(getApiError(err)).toBe(err);
  });

  it('returns undefined for a vanilla Error instance', () => {
    expect(getApiError(new Error('network down'))).toBeUndefined();
  });

  it('returns undefined for null', () => {
    expect(getApiError(null)).toBeUndefined();
  });

  it('returns undefined for primitives', () => {
    expect(getApiError(undefined)).toBeUndefined();
    expect(getApiError('boom')).toBeUndefined();
    expect(getApiError(42)).toBeUndefined();
    expect(getApiError(true)).toBeUndefined();
  });
});
