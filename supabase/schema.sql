create extension if not exists pgcrypto;

-- Sprint 6 staging schema. Existing legacy columns remain additive so deployed
-- Sprint 4-5 repositories can migrate without downtime.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  external_user_id text unique,
  name text,
  email text,
  whatsapp text,
  preferred_language text not null default 'es',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers add column if not exists customer_id text;
alter table public.customers add column if not exists phone text;
alter table public.customers add column if not exists customer_type text not null default 'retail';
alter table public.customers add column if not exists metadata jsonb not null default '{}'::jsonb;
update public.customers
set customer_id = external_user_id,
    phone = coalesce(phone, whatsapp)
where customer_id is null or phone is null;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  category text,
  available boolean not null default true,
  price_aed numeric(10, 2),
  stock integer not null default 0 check (stock >= 0),
  description text,
  languages text[] not null default array['es', 'en'],
  b2b_available boolean not null default false,
  keywords text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id text,
  customer_name text,
  email text,
  status text,
  payment_status text,
  delivery_status text,
  estimated_delivery date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists order_id text;
alter table public.orders add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.orders add column if not exists metadata jsonb not null default '{}'::jsonb;
update public.orders set order_id = order_number where order_id is null;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sku text,
  name text,
  quantity integer not null default 1 check (quantity > 0),
  price_aed numeric(10, 2),
  created_at timestamptz not null default now(),
  unique (order_id, sku)
);

create table if not exists public.b2b_leads (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  business_name text,
  city text,
  emirate text,
  business_type text,
  products_of_interest text[] not null default '{}',
  requested_products text[] not null default '{}',
  estimated_volume text,
  contact_name text,
  email text,
  whatsapp text,
  phone text,
  status text not null default 'new',
  missing_fields text[] not null default '{}',
  source text not null default 'ai_worker',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.b2b_leads add column if not exists lead_id text;
alter table public.b2b_leads add column if not exists metadata jsonb not null default '{}'::jsonb;
update public.b2b_leads set lead_id = id::text where lead_id is null;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_id text unique,
  user_id text not null,
  status text not null default 'active',
  main_worker text,
  main_intent text,
  last_worker text,
  last_intent text,
  last_message text,
  metadata jsonb not null default '{}'::jsonb,
  channel text not null default 'web',
  customer_email text,
  customer_name text,
  requires_human boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.conversations add column if not exists conversation_id text unique;
alter table public.conversations add column if not exists last_worker text;
alter table public.conversations add column if not exists last_intent text;
alter table public.conversations add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.conversations add column if not exists channel text not null default 'web';
alter table public.conversations add column if not exists customer_email text;
alter table public.conversations add column if not exists customer_name text;

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id text not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  intent text,
  worker text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

update public.conversations
set conversation_id = id::text,
    last_worker = coalesce(last_worker, main_worker),
    last_intent = coalesce(last_intent, main_intent)
where conversation_id is null
   or last_worker is null
   or last_intent is null;

-- Copy legacy messages once when upgrading an existing Sprint 5 database.
do $$
begin
  if to_regclass('public.messages') is not null then
    execute $migration$
      insert into public.conversation_messages (
        id, conversation_id, user_id, role, content, intent, worker, metadata, created_at
      )
      select
        id, conversation_id, user_id, role, content, intent, worker, metadata, created_at
      from public.messages
      on conflict (id) do nothing
    $migration$;
  end if;
end;
$$;

create table if not exists public.ai_worker_runs (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete set null,
  user_id text,
  worker text not null,
  intent text,
  input text,
  output text,
  metadata jsonb not null default '{}'::jsonb,
  success boolean not null default true,
  error_message text,
  latency_ms integer,
  created_at timestamptz not null default now()
);

create table if not exists public.worker_events (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete set null,
  worker text,
  intent text,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  source text not null default 'memory',
  created_at timestamptz not null default now()
);

alter table public.products add column if not exists available boolean not null default true;
alter table public.products add column if not exists keywords text[] not null default '{}';
alter table public.orders add column if not exists email text;
alter table public.b2b_leads add column if not exists emirate text;
alter table public.b2b_leads add column if not exists requested_products text[] not null default '{}';
alter table public.b2b_leads add column if not exists phone text;
alter table public.conversations add column if not exists conversation_id text unique;
alter table public.conversations add column if not exists last_worker text;
alter table public.conversations add column if not exists last_intent text;
alter table public.conversations add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists conversations_user_id_idx on public.conversations(user_id);
create unique index if not exists conversations_conversation_id_idx on public.conversations(conversation_id);
create index if not exists conversations_updated_at_idx on public.conversations(updated_at desc);
create index if not exists conversations_created_at_idx on public.conversations(created_at desc);
create index if not exists conversation_messages_conversation_id_idx on public.conversation_messages(conversation_id);
create index if not exists conversation_messages_user_id_created_at_idx on public.conversation_messages(user_id, created_at desc);
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_order_id_idx on public.orders(order_id);
create index if not exists orders_email_idx on public.orders(email);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists products_category_idx on public.products(category);
create index if not exists products_active_idx on public.products(active);
create index if not exists products_sku_idx on public.products(sku);
create index if not exists products_created_at_idx on public.products(created_at desc);
create index if not exists b2b_leads_user_id_idx on public.b2b_leads(user_id);
create index if not exists b2b_leads_status_idx on public.b2b_leads(status);
create index if not exists b2b_leads_lead_id_idx on public.b2b_leads(lead_id);
create index if not exists b2b_leads_email_idx on public.b2b_leads(email);
create index if not exists b2b_leads_created_at_idx on public.b2b_leads(created_at desc);
create index if not exists customers_customer_id_idx on public.customers(customer_id);
create index if not exists customers_email_idx on public.customers(email);
create index if not exists ai_worker_runs_worker_idx on public.ai_worker_runs(worker);
create index if not exists ai_worker_runs_created_at_idx on public.ai_worker_runs(created_at desc);
create index if not exists worker_events_conversation_id_idx on public.worker_events(conversation_id);
create index if not exists worker_events_created_at_idx on public.worker_events(created_at desc);

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists leads_set_updated_at on public.b2b_leads;
create trigger leads_set_updated_at before update on public.b2b_leads
for each row execute function public.set_updated_at();

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at before update on public.conversations
for each row execute function public.set_updated_at();

alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.b2b_leads enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.ai_worker_runs enable row level security;
alter table public.worker_events enable row level security;

comment on table public.customers is
  'Customer identities and contact preferences used by internal workers.';
comment on table public.products is
  'Retail and B2B catalog. Price and stock are authoritative worker facts.';
comment on table public.orders is
  'Order status, payment and delivery facts used by the orders worker.';
comment on table public.order_items is
  'Normalized order lines retained for compatibility with the dashboard.';
comment on table public.b2b_leads is
  'Structured commercial leads captured progressively by the B2B worker.';
comment on table public.conversations is
  'Conversation state and latest routing summary for every supported channel.';
comment on table public.conversation_messages is
  'User and assistant turns with routing metadata and idempotency keys.';
comment on table public.ai_worker_runs is
  'Worker execution audit including outcome and latency.';
comment on table public.worker_events is
  'Operational events for lead, order, handoff and error observability.';
comment on schema public is
  'CórnerOps backend uses the server-only service role key. Auth policies will be added in a later sprint.';
