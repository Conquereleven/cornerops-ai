import { describe, expect, test } from 'vitest';
import { safeNextPath } from './routeSecurity';

describe('safeNextPath', () => {
  test.each([
    ['https://attacker.example/path', '/overview'],
    ['//attacker.example/path', '/overview'],
    ['/\\attacker.example', '/overview'],
    ['', '/overview'],
    ['/app?tab=ready', '/app?tab=ready'],
  ])('normalizes %s to %s', (value, expected) => {
    expect(safeNextPath(value)).toBe(expected);
  });
});
