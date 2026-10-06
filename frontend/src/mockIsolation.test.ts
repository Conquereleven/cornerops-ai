import { describe, expect, test } from 'vitest';
import { moduleRegistry } from './config/moduleRegistry';

describe('production mock isolation',()=>{
  test('runtime registry carries no mock data state or sample records',()=>{
    const serialized=JSON.stringify(moduleRegistry);
    expect(serialized).not.toMatch(/Data layer MOCK|Usuario 1|order #123|conv-demo|mockData/);
  });
  test('every module is navigable and none can perform an external action',()=>{
    expect(moduleRegistry.every(item=>item.route.startsWith('/app')&&item.blockedActions.includes('external_actions'))).toBe(true);
  });
});
