import { describe, expect, test } from 'vitest';
import { moduleGroups, moduleRegistry } from './moduleRegistry';

describe('v1.15 canonical module registry',()=>{
  test('contains every required module exactly once',()=>{
    expect(moduleRegistry).toHaveLength(35);
    expect(new Set(moduleRegistry.map(item=>item.key)).size).toBe(35);
    expect(new Set(moduleRegistry.map(item=>item.route)).size).toBe(35);
    expect(moduleGroups).toHaveLength(7);
  });
  test('preserves governance and all marketing modules',()=>{
    const routes=new Set(moduleRegistry.map(item=>item.route));
    ['/work-queue','/approvals','/audit-log','/security','/environment-doctor','/flow-engine','/intelligence','/drafts','/telegram','/marketing','/marketing/campaigns','/marketing/content','/marketing/brand','/marketing/assets','/marketing/promotions','/marketing/audiences','/marketing/calendar','/marketing/analytics'].forEach(route=>expect(routes.has(route)).toBe(true));
  });
  test('defines legacy aliases without duplicate canonical routes',()=>{
    expect(moduleRegistry.find(item=>item.key==='overview')?.aliases).toContain('/');
    expect(moduleRegistry.find(item=>item.key==='ai-chat')?.aliases).toContain('/chat');
    expect(moduleRegistry.find(item=>item.key==='b2b-leads')?.aliases).toContain('/leads');
  });
  test('blocks writes and external actions for every module',()=>{
    moduleRegistry.forEach(item=>{expect(item.readOnly).toBe(true);expect(item.blockedActions).toContain('production_writes');expect(item.blockedActions).toContain('external_actions')});
  });
});
