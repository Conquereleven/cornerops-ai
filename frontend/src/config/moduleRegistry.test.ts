import { describe, expect, test } from 'vitest';
import { moduleRegistry, navigationFor, navigationSurfaces } from './moduleRegistry';

const labels = (role: 'viewer' | 'operator' | 'founder', surface: string) => navigationFor(role).find((section) => section.surface === surface)?.modules.map((item) => item.label) ?? [];

describe('consolidated module registry', () => {
  test('every module has one canonical route under /app and a declared surface', () => {
    expect(new Set(moduleRegistry.map((item) => item.key)).size).toBe(moduleRegistry.length);
    expect(new Set(moduleRegistry.map((item) => item.route)).size).toBe(moduleRegistry.length);
    moduleRegistry.forEach((item) => {
      expect(item.route === '/app' || item.route.startsWith('/app/')).toBe(true);
      expect(['core', 'admin', 'incubator', 'hidden']).toContain(item.surface);
    });
  });

  test('core navigation is the small company operating set', () => {
    expect(labels('founder', 'core')).toEqual(['Overview', 'Sales', 'Work Queue', 'Intelligence', 'Approvals', 'Audit', 'AI Chat', 'Control Tower']);
    expect(navigationSurfaces).toEqual(['core', 'admin', 'incubator']);
  });

  test('admin is founder-only; viewers do not see operator-only modules', () => {
    expect(labels('founder', 'admin')).toEqual(['Security', 'Integrations', 'Settings', 'Capability Status', 'Environment']);
    expect(labels('operator', 'admin')).toEqual([]);
    expect(labels('viewer', 'admin')).toEqual([]);
    expect(labels('viewer', 'core')).not.toContain('AI Chat');
    expect(navigationFor(undefined)).toEqual([]);
  });

  test('Commerce OS and CornerMex live in the incubator, not in core', () => {
    const incubator = moduleRegistry.filter((item) => item.surface === 'incubator');
    expect(incubator.every((item) => item.route.startsWith('/app/labs/commerce-os'))).toBe(true);
    ['products', 'orders', 'authorized-sellers', 'seller-catalog', 'seller-inventory', 'seller-comparison', 'cornermex-ops', 'commercial-overview']
      .forEach((key) => expect(incubator.map((item) => item.key)).toContain(key));
    expect(moduleRegistry.filter((item) => item.surface === 'core').some((item) => /cornermex|commerce/i.test(`${item.key} ${item.label}`))).toBe(false);
  });

  test('marketing, promotions and experimental modules are hidden from navigation but kept', () => {
    const hidden = moduleRegistry.filter((item) => item.surface === 'hidden').map((item) => item.key);
    ['marketing', 'campaigns', 'content', 'brand', 'assets', 'promotions', 'audiences', 'calendar', 'analytics', 'flow-engine', 'drafts', 'product-activation', 'telegram', 'worker-settings']
      .forEach((key) => expect(hidden).toContain(key));
    const visible = navigationFor('founder').flatMap((section) => section.modules.map((item) => item.key));
    hidden.forEach((key) => expect(visible).not.toContain(key));
  });

  test('legacy paths are unique, never the public root, and never under /app', () => {
    const legacy = moduleRegistry.flatMap((item) => item.legacyRoutes);
    expect(new Set(legacy).size).toBe(legacy.length);
    expect(legacy).not.toContain('/');
    expect(legacy).not.toContain('/login');
    expect(legacy.some((path) => path === '/app' || path.startsWith('/app/') || path.startsWith('/auth/') || path === '/access-pending')).toBe(false);
    expect(moduleRegistry.find((item) => item.key === 'overview')?.legacyRoutes).toEqual(['/overview']);
  });

  test('external actions are blocked everywhere; only Sales allows internal writes', () => {
    moduleRegistry.forEach((item) => expect(item.blockedActions).toContain('external_actions'));
    expect(moduleRegistry.filter((item) => !item.readOnly).map((item) => item.key)).toEqual(['sales']);
  });
});
