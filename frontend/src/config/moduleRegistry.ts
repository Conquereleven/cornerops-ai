import type { LucideIcon } from 'lucide-react';
import { Activity, Archive, BarChart3, Bot, Boxes, BriefcaseBusiness, CalendarDays, CheckCheck, ClipboardCheck, FileText, GitBranch, Handshake, HeartHandshake, Image, LayoutDashboard, Library, ListChecks, Megaphone, MessageSquareText, PackageCheck, PackageSearch, Palette, PlugZap, Radio, ScanSearch, Settings, ShieldCheck, ShoppingBasket, Store, Tags, Users, WandSparkles, Workflow, Wrench } from 'lucide-react';

// core: runs Corner Tech AI itself. admin: founder configuration. incubator:
// Commerce OS product work, visible but separate. hidden: kept and routable for
// authorized members, not in navigation until a customer need validates it.
export type ModuleSurface = 'core' | 'admin' | 'incubator' | 'hidden';
export type ModuleRole = 'viewer' | 'operator' | 'founder';
export type ModuleGroup = 'Core' | 'Admin' | 'Commerce OS · Incubator' | 'Deferred';
export type ModuleKey = 'overview'|'sales'|'control-tower'|'ai-chat'|'commerce-overview'|'cornermex-ops'|'orders'|'products'|'b2b-leads'|'conversations'|'commercial-overview'|'commercial-accounts'|'commercial-opportunities'|'commercial-quotes'|'commercial-orders'|'commercial-payments'|'commercial-fulfillment'|'commercial-deliveries'|'commercial-exceptions'|'commercial-daily-close'|'authorized-sellers'|'seller-catalog'|'seller-inventory'|'seller-comparison'|'marketing'|'campaigns'|'content'|'brand'|'assets'|'promotions'|'audiences'|'calendar'|'analytics'|'flow-engine'|'intelligence'|'work-queue'|'drafts'|'worker-settings'|'product-activation'|'approvals'|'audit-log'|'security'|'capabilities'|'environment-doctor'|'telegram'|'integrations'|'settings';

export interface CommandCenterModule {
  key: ModuleKey;
  label: string;
  surface: ModuleSurface;
  group: ModuleGroup;
  /** Canonical private route. Always under /app. */
  route: string;
  /** Pre-consolidation paths that redirect to `route` inside the guard. */
  legacyRoutes: string[];
  icon: LucideIcon;
  description: string;
  readOnly: boolean;
  minRole: ModuleRole;
  requiredPermission: 'operator_read' | 'operator_controlled';
  blockedActions: string[];
  workspaceTypes?: string[];
  featureFlag?: string;
  sortOrder: number;
}

const GROUP: Record<ModuleSurface, ModuleGroup> = { core: 'Core', admin: 'Admin', incubator: 'Commerce OS · Incubator', hidden: 'Deferred' };
const PREFIX: Record<ModuleSurface, string> = { core: '/app', admin: '/app/admin', incubator: '/app/labs/commerce-os', hidden: '/app/labs/deferred' };

const m = (surface: ModuleSurface, key: ModuleKey, label: string, slug: string, icon: LucideIcon, description: string, sortOrder: number, legacyRoutes: string[] = [], options: Partial<CommandCenterModule> = {}): CommandCenterModule => ({
  key, label, surface, group: GROUP[surface], route: `${PREFIX[surface]}${slug ? `/${slug}` : ''}`, legacyRoutes, icon, description, sortOrder,
  readOnly: true, minRole: surface === 'admin' ? 'founder' : 'viewer', requiredPermission: 'operator_read',
  blockedActions: ['production_writes', 'external_actions'], ...options,
});

export const moduleRegistry: CommandCenterModule[] = [
  // Core — the Corner Tech AI company workspace.
  m('core', 'overview', 'Overview', 'overview', LayoutDashboard, 'What needs the Founder today across Corner Tech AI.', 10, ['/overview']),
  m('core', 'sales', 'Sales', 'sales', Handshake, 'Accounts, contacts, opportunities and activity for Corner Tech AI.', 20, [], { readOnly: false, requiredPermission: 'operator_controlled', blockedActions: ['external_actions'] }),
  m('core', 'work-queue', 'Work Queue', 'work-queue', ListChecks, 'Persistent internal recommendations.', 30, ['/work-queue']),
  m('core', 'intelligence', 'Intelligence', 'intelligence', ScanSearch, 'Internal intelligence and evidence.', 40, ['/intelligence']),
  m('core', 'approvals', 'Approvals', 'approvals', CheckCheck, 'Decisions that need the Founder.', 50, ['/approvals']),
  m('core', 'audit-log', 'Audit', 'audit', Activity, 'Append-only sanitized evidence.', 60, ['/audit-log']),
  m('core', 'ai-chat', 'AI Chat', 'chat', MessageSquareText, 'Internal operator conversation.', 70, ['/ai-chat', '/chat'], { minRole: 'operator' }),
  m('core', 'control-tower', 'Control Tower', 'control-tower', ShieldCheck, 'Governance, safety and readiness.', 80, ['/control-tower']),

  // Admin — founder only.
  m('admin', 'security', 'Security', 'security', ShieldCheck, 'Fail-closed security posture.', 10, ['/security']),
  m('admin', 'integrations', 'Integrations', 'integrations', PlugZap, 'Integration readiness and disabled channels.', 20, ['/integrations']),
  m('admin', 'settings', 'Settings', 'settings', Settings, 'Workspace settings.', 30, ['/settings']),
  m('admin', 'capabilities', 'Capability Status', 'capabilities', ShieldCheck, 'Truthful non-executing capability registry.', 40, ['/capabilities']),
  m('admin', 'environment-doctor', 'Environment', 'environment', Wrench, 'Configuration readiness without secret values.', 50, ['/environment-doctor']),

  // Commerce OS incubator — product work, not company operations.
  m('incubator', 'commerce-overview', 'Commerce OS Overview', '', LayoutDashboard, 'Seller network and inventory evidence for the Commerce OS incubator.', 5),
  m('incubator', 'products', 'Products', 'products', Tags, 'CornerMex active products, separate from seller listings.', 10, ['/products']),
  m('incubator', 'orders', 'Orders', 'orders', PackageSearch, 'Read-only order records.', 20, ['/orders']),
  m('incubator', 'authorized-sellers', 'Authorized Sellers', 'authorized-sellers', Store, 'Verified seller profiles and readiness.', 30, ['/authorized-sellers']),
  m('incubator', 'seller-catalog', 'Seller Catalog', 'seller-catalog', Library, 'Verified seller catalog listings.', 40, ['/seller-catalog']),
  m('incubator', 'seller-inventory', 'Seller Inventory', 'seller-inventory', PackageCheck, 'Operational inventory provenance.', 50, ['/seller-inventory']),
  m('incubator', 'seller-comparison', 'Seller Comparison', 'seller-comparison', GitBranch, 'Deterministic comparison within verified scope.', 60, ['/seller-comparison']),
  m('incubator', 'cornermex-ops', 'CornerMex Ops', 'cornermex', BriefcaseBusiness, 'Read-only CornerMex operating status.', 70, ['/cornermex-ops']),
  m('incubator', 'b2b-leads', 'CornerMex B2B Leads', 'cornermex-leads', Users, 'Read-only CornerMex B2B opportunity records.', 80, ['/b2b-leads', '/leads']),
  m('incubator', 'conversations', 'Conversations', 'conversations', Bot, 'Persisted internal conversation history.', 90, ['/conversations']),
  m('incubator', 'commercial-overview', 'Commercial Overview', 'commercial', BriefcaseBusiness, 'CornerMex commercial pipeline and daily priorities.', 100, ['/commercial']),
  m('incubator', 'commercial-accounts', 'Commercial Accounts', 'commercial/accounts', Users, 'CornerMex B2B account coverage without contact PII.', 110, ['/commercial/accounts']),
  m('incubator', 'commercial-opportunities', 'Commercial Opportunities', 'commercial/opportunities', GitBranch, 'CornerMex commercial opportunities and next actions.', 120, ['/commercial/opportunities']),
  m('incubator', 'commercial-quotes', 'Quotes', 'commercial/quotes', FileText, 'Internal quotes with pricing evidence and send controls.', 130, ['/commercial/quotes']),
  m('incubator', 'commercial-orders', 'Commercial Orders', 'commercial/orders', PackageSearch, 'Accepted quotes and internal order state.', 140, ['/commercial/orders']),
  m('incubator', 'commercial-payments', 'Payments', 'commercial/payments', ClipboardCheck, 'Bank Transfer settlement and COD remittance evidence; no capture.', 150, ['/commercial/payments']),
  m('incubator', 'commercial-fulfillment', 'Fulfillment', 'commercial/fulfillment', Boxes, 'Evidence-backed Intermex handoff, pick and pack milestones.', 160, ['/commercial/fulfillment']),
  m('incubator', 'commercial-deliveries', 'Deliveries', 'commercial/deliveries', PackageCheck, 'Separate carrier handoff and delivery evidence.', 170, ['/commercial/deliveries']),
  m('incubator', 'commercial-exceptions', 'Exceptions', 'commercial/exceptions', ShieldCheck, 'Commercial and warehouse blockers requiring accountable resolution.', 180, ['/commercial/exceptions']),
  m('incubator', 'commercial-daily-close', 'Daily Close', 'commercial/daily-close', CalendarDays, 'Daily separation of quotes, orders, COD collection and remitted cash.', 190, ['/commercial/daily-close']),

  // Deferred — routable for members, absent from navigation.
  m('hidden', 'marketing', 'Marketing Hub', 'marketing', Megaphone, 'Read-only marketing readiness and internal evidence.', 10, ['/marketing']),
  m('hidden', 'campaigns', 'Campaign Planner', 'marketing/campaigns', ClipboardCheck, 'Internal campaign planning; publishing blocked.', 20, ['/marketing/campaigns']),
  m('hidden', 'content', 'Content Studio', 'marketing/content', FileText, 'Internal drafts only; external sends blocked.', 30, ['/marketing/content']),
  m('hidden', 'brand', 'Brand Studio', 'marketing/brand', Palette, 'Brand guidance and verified assets.', 40, ['/marketing/brand']),
  m('hidden', 'assets', 'Asset Library', 'marketing/assets', Image, 'Private managed seller media evidence.', 50, ['/marketing/assets']),
  m('hidden', 'promotions', 'Promotions', 'marketing/promotions', WandSparkles, 'Promotion proposals; activation blocked.', 60, ['/marketing/promotions']),
  m('hidden', 'audiences', 'Audience Segments', 'marketing/audiences', HeartHandshake, 'Aggregated segments without raw PII.', 70, ['/marketing/audiences']),
  m('hidden', 'calendar', 'Marketing Calendar', 'marketing/calendar', CalendarDays, 'Internal schedule; no automatic publishing.', 80, ['/marketing/calendar']),
  m('hidden', 'analytics', 'Performance Analytics', 'marketing/analytics', BarChart3, 'Real metrics only; empty until connected.', 90, ['/marketing/analytics']),
  m('hidden', 'flow-engine', 'Flow Engine', 'flow-engine', Workflow, 'Read-only operational flow analysis.', 100, ['/flow-engine']),
  m('hidden', 'drafts', 'Drafts', 'drafts', Archive, 'Local drafts that are not externally sendable.', 110, ['/drafts']),
  m('hidden', 'worker-settings', 'Worker Settings', 'worker-settings', Wrench, 'Worker configuration and safety posture.', 120, ['/worker-settings'], { minRole: 'founder' }),
  m('hidden', 'product-activation', 'Product Activation', 'product-activation', ShoppingBasket, 'Activation remains blocked.', 130, ['/product-activation']),
  m('hidden', 'telegram', 'Telegram', 'telegram', Radio, 'Founder allowlist and polling status.', 140, ['/telegram'], { minRole: 'founder' }),
];

export const navigationSurfaces: ModuleSurface[] = ['core', 'admin', 'incubator'];
export const moduleByKey = Object.fromEntries(moduleRegistry.map((item) => [item.key, item])) as Record<ModuleKey, CommandCenterModule>;
export const modulePath = (key: ModuleKey) => moduleByKey[key].route;

const ROLE_ORDER: ModuleRole[] = ['viewer', 'operator', 'founder'];
export const moduleVisibleTo = (item: CommandCenterModule, role: ModuleRole | undefined) => (
  Boolean(role) && ROLE_ORDER.indexOf(role as ModuleRole) >= ROLE_ORDER.indexOf(item.minRole)
);

// Navigation for a role: only core/admin/incubator surfaces, only allowed modules.
export const navigationFor = (role: ModuleRole | undefined) => navigationSurfaces
  .map((surface) => ({
    surface,
    group: GROUP[surface],
    modules: moduleRegistry
      .filter((item) => item.surface === surface && moduleVisibleTo(item, role))
      .sort((left, right) => left.sortOrder - right.sortOrder),
  }))
  .filter((section) => section.modules.length > 0);
