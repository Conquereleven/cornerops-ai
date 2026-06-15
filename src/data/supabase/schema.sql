create extension if not exists pgcrypto;

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
  requires_human boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
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
create index if not exists conversations_updated_at_idx on public.conversations(updated_at desc);
create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists messages_user_id_created_at_idx on public.messages(user_id, created_at desc);
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists products_category_idx on public.products(category);
create index if not exists products_active_idx on public.products(active);
create index if not exists b2b_leads_user_id_idx on public.b2b_leads(user_id);
create index if not exists b2b_leads_status_idx on public.b2b_leads(status);
create index if not exists ai_worker_runs_worker_idx on public.ai_worker_runs(worker);
create index if not exists ai_worker_runs_created_at_idx on public.ai_worker_runs(created_at desc);

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
alter table public.messages enable row level security;
alter table public.ai_worker_runs enable row level security;

comment on schema public is
  'CórnerOps backend uses the server-only service role key. Auth policies will be added in a later sprint.';
