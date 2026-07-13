import { describe, expect, test } from 'vitest';
import { moduleRegistry } from './config/moduleRegistry';

describe('production mock isolation',()=>{
  test('runtime registry carries no mock data state or sample records',()=>{
    const serialized=JSON.stringify(moduleRegistry);
    expect(serialized).not.toMatch(/Data layer MOCK|Usuario 1|order #123|conv-demo|mockData/);
  });
  test('unavailable modules remain navigable and read-only',()=>{
    expect(moduleRegistry.every(item=>item.route.startsWith('/')&&item.readOnly)).toBe(true);
  });
});
