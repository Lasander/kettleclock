import { describe, it, expect } from 'vitest';
import { generateId } from '../utils';

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('returns non-empty strings', () => {
    expect(generateId().length).toBeGreaterThan(0);
  });

  it('returns unique values across 200 calls', () => {
    const ids = new Set(Array.from({ length: 200 }, () => generateId()));
    expect(ids.size).toBe(200);
  });
});
