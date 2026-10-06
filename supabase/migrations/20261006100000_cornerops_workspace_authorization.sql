-- CornerOps workspace authorization: workspaces and memberships.
-- Additive. Rollback: drop table cornerops_internal.workspace_memberships, cornerops_internal.workspaces.
-- The web runtime role can only read these tables; memberships are written by an
-- intentional operator action (npm run workspace:grant) on an administrative connection.
begin;

create schema if not exists cornerops_internal;
revoke all on schema cornerops_internal from public, anon, authenticated, service_role;

create table if not exists cornerops_internal.workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,62}$'),
  name text not null check (length(name) between 1 and 120),
  status text not null default 'active' check (status in ('active','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cornerops_internal.workspace_memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references cornerops_internal.workspaces(id),
  auth_user_id uuid not null,
  role text not null check (role in ('founder','operator','viewer')),
  status text not null default 'active' check (status in ('active','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, auth_user_id)
);

create index if not exists workspace_memberships_user_status_idx
  on cornerops_internal.workspace_memberships(auth_user_id, status);

-- The company workspace. No user is granted access by this migration.
insert into cornerops_internal.workspaces (slug, name)
values ('cornerops-ai', 'CornerOps AI')
on conflict (slug) do nothing;

alter table cornerops_internal.workspaces enable row level security;
alter table cornerops_internal.workspace_memberships enable row level security;

drop policy if exists workspaces_runtime_read on cornerops_internal.workspaces;
create policy workspaces_runtime_read on cornerops_internal.workspaces
  for select to cornerops_internal_runtime using (true);
drop policy if exists workspace_memberships_runtime_read on cornerops_internal.workspace_memberships;
create policy workspace_memberships_runtime_read on cornerops_internal.workspace_memberships
  for select to cornerops_internal_runtime using (true);

revoke all on cornerops_internal.workspaces, cornerops_internal.workspace_memberships
  from public, anon, authenticated, service_role, cornerops_internal_runtime;
grant select on cornerops_internal.workspaces to cornerops_internal_runtime;
grant select on cornerops_internal.workspace_memberships to cornerops_internal_runtime;

commit;
