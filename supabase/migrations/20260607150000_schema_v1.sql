create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'producer', 'agent', 'manager');
create type public.lead_status as enum ('new', 'qualified', 'rejected', 'offer_ready', 'converted');
create type public.offer_status as enum ('draft', 'generated', 'review', 'approved', 'prepared', 'sent', 'replied', 'won', 'lost');
create type public.brand_asset_status as enum ('candidate', 'approved', 'rejected', 'needs_review');
create type public.prototype_status as enum ('draft', 'generated', 'approved', 'rejected', 'needs_review');
create type public.job_status as enum ('queued', 'running', 'succeeded', 'failed', 'cancelled');
create type public.job_type as enum (
  'lead.import',
  'lead.classify',
  'lead.score',
  'offer.generate',
  'prototype.create_brief',
  'prototype.render',
  'prototype.qc',
  'offer.render_html',
  'offer.render_pdf',
  'message.prepare'
);
create type public.message_status as enum ('draft', 'prepared', 'approved', 'sent', 'cancelled');
create type public.deal_status as enum ('open', 'won', 'lost', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role public.app_role not null default 'agent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  industry text,
  city text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  full_name text not null,
  role_title text,
  email text,
  phone text,
  source text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  target_industries text[] not null default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campaign_leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  status public.lead_status not null default 'new',
  evidence jsonb not null default '{}'::jsonb,
  score numeric(5,2),
  score_breakdown jsonb not null default '{}'::jsonb,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, organization_id, contact_id)
);

create table public.product_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  technology text not null,
  min_quantity integer not null default 1 check (min_quantity > 0),
  price_from numeric(12,2) not null check (price_from >= 0),
  production_days integer not null check (production_days > 0),
  target_industries text[] not null default '{}',
  margin_percent numeric(5,2) check (margin_percent is null or margin_percent >= 0),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_items (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.product_packages(id) on delete cascade,
  name text not null,
  sku text,
  description text,
  base_cost numeric(12,2) check (base_cost is null or base_cost >= 0),
  price_from numeric(12,2) check (price_from is null or price_from >= 0),
  attributes jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.portfolio_assets (
  id uuid primary key default gen_random_uuid(),
  package_id uuid references public.product_packages(id) on delete set null,
  title text not null,
  storage_bucket text not null default 'portfolio-assets',
  storage_path text not null,
  mime_type text,
  width integer,
  height integer,
  allowed_for_offer boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create table public.mockup_template_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_bucket text not null default 'mockup-sources',
  source_path text not null,
  source_kind text not null default 'psd' check (source_kind in ('psd', 'ai', 'figma_export', 'other')),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_bucket, source_path)
);

create table public.mockup_templates (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.mockup_template_sources(id) on delete set null,
  name text not null,
  product_package_id uuid references public.product_packages(id) on delete set null,
  template_bucket text not null default 'mockup-templates',
  template_prefix text not null,
  preview_path text,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_bucket, template_prefix)
);

create table public.brand_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  status public.brand_asset_status not null default 'candidate',
  original_bucket text not null default 'company-logos',
  original_path text not null,
  quality_score numeric(5,2),
  warnings text[] not null default '{}',
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brand_asset_variants (
  id uuid primary key default gen_random_uuid(),
  brand_asset_id uuid not null references public.brand_assets(id) on delete cascade,
  variant_kind text not null check (variant_kind in ('original', 'transparent_png', 'vector', 'monochrome', 'prepared')),
  storage_bucket text not null default 'company-logos',
  storage_path text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  campaign_lead_id uuid references public.campaign_leads(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  product_package_id uuid references public.product_packages(id) on delete set null,
  status public.offer_status not null default 'draft',
  title text not null,
  summary text,
  draft jsonb not null default '{}'::jsonb,
  warnings text[] not null default '{}',
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.offer_assets (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  asset_kind text not null check (asset_kind in ('portfolio', 'prototype_render', 'export', 'attachment')),
  storage_bucket text not null,
  storage_path text not null,
  sendable boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.prototype_briefs (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references public.offers(id) on delete cascade,
  brand_asset_id uuid references public.brand_assets(id) on delete set null,
  mockup_template_id uuid references public.mockup_templates(id) on delete set null,
  status public.prototype_status not null default 'draft',
  brief jsonb not null default '{}'::jsonb,
  warnings text[] not null default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prototype_renders (
  id uuid primary key default gen_random_uuid(),
  prototype_brief_id uuid not null references public.prototype_briefs(id) on delete cascade,
  status public.prototype_status not null default 'generated',
  storage_bucket text not null default 'generated-mockups',
  storage_path text not null,
  preview_watermarked boolean not null default true,
  qc_score numeric(5,2),
  qc_warnings text[] not null default '{}',
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  type public.job_type not null,
  status public.job_status not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  error text,
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts > 0),
  locked_by text,
  locked_until timestamptz,
  run_after timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  status public.message_status not null default 'draft',
  channel text not null default 'email' check (channel in ('email', 'telegram', 'whatsapp', 'phone', 'other')),
  recipient_contact_id uuid references public.contacts(id) on delete set null,
  subject text,
  body text not null,
  prepared_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  sent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint no_sent_without_approval check (status <> 'sent' or approved_at is not null)
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references public.offers(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  status public.deal_status not null default 'open',
  amount numeric(12,2) check (amount is null or amount >= 0),
  cost numeric(12,2) check (cost is null or cost >= 0),
  margin numeric(12,2),
  owner_id uuid references public.profiles(id) on delete set null,
  won_at timestamptz,
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  basis_amount numeric(12,2) not null default 0 check (basis_amount >= 0),
  rate_percent numeric(5,2) not null default 0 check (rate_percent >= 0),
  amount numeric(12,2) generated always as (round((basis_amount * rate_percent / 100.0), 2)) stored,
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'void')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin'::public.app_role
$$;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    'agent'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger contacts_set_updated_at before update on public.contacts for each row execute function public.set_updated_at();
create trigger campaigns_set_updated_at before update on public.campaigns for each row execute function public.set_updated_at();
create trigger campaign_leads_set_updated_at before update on public.campaign_leads for each row execute function public.set_updated_at();
create trigger product_packages_set_updated_at before update on public.product_packages for each row execute function public.set_updated_at();
create trigger product_items_set_updated_at before update on public.product_items for each row execute function public.set_updated_at();
create trigger portfolio_assets_set_updated_at before update on public.portfolio_assets for each row execute function public.set_updated_at();
create trigger mockup_template_sources_set_updated_at before update on public.mockup_template_sources for each row execute function public.set_updated_at();
create trigger mockup_templates_set_updated_at before update on public.mockup_templates for each row execute function public.set_updated_at();
create trigger brand_assets_set_updated_at before update on public.brand_assets for each row execute function public.set_updated_at();
create trigger offers_set_updated_at before update on public.offers for each row execute function public.set_updated_at();
create trigger prototype_briefs_set_updated_at before update on public.prototype_briefs for each row execute function public.set_updated_at();
create trigger prototype_renders_set_updated_at before update on public.prototype_renders for each row execute function public.set_updated_at();
create trigger jobs_set_updated_at before update on public.jobs for each row execute function public.set_updated_at();
create trigger messages_set_updated_at before update on public.messages for each row execute function public.set_updated_at();
create trigger deals_set_updated_at before update on public.deals for each row execute function public.set_updated_at();
create trigger commissions_set_updated_at before update on public.commissions for each row execute function public.set_updated_at();

create index contacts_organization_id_idx on public.contacts(organization_id);
create index campaign_leads_campaign_id_idx on public.campaign_leads(campaign_id);
create index campaign_leads_status_idx on public.campaign_leads(status);
create index product_packages_active_idx on public.product_packages(is_active);
create index product_items_package_id_idx on public.product_items(package_id);
create index portfolio_assets_package_id_idx on public.portfolio_assets(package_id);
create index mockup_templates_active_idx on public.mockup_templates(is_active);
create index brand_assets_organization_id_idx on public.brand_assets(organization_id);
create index offers_status_idx on public.offers(status);
create index offers_organization_id_idx on public.offers(organization_id);
create index prototype_renders_status_idx on public.prototype_renders(status);
create index jobs_queue_idx on public.jobs(status, run_after, locked_until) where status = 'queued';
create index messages_offer_id_idx on public.messages(offer_id);
create index deals_status_idx on public.deals(status);
create index audit_events_entity_idx on public.audit_events(entity_type, entity_id);
create index audit_events_created_at_idx on public.audit_events(created_at desc);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.contacts enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_leads enable row level security;
alter table public.product_packages enable row level security;
alter table public.product_items enable row level security;
alter table public.portfolio_assets enable row level security;
alter table public.mockup_template_sources enable row level security;
alter table public.mockup_templates enable row level security;
alter table public.brand_assets enable row level security;
alter table public.brand_asset_variants enable row level security;
alter table public.offers enable row level security;
alter table public.offer_assets enable row level security;
alter table public.prototype_briefs enable row level security;
alter table public.prototype_renders enable row level security;
alter table public.jobs enable row level security;
alter table public.messages enable row level security;
alter table public.deals enable row level security;
alter table public.commissions enable row level security;
alter table public.audit_events enable row level security;
alter table public.settings enable row level security;

create policy "profiles read self or admin" on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_admin());

create policy "profiles update self or admin" on public.profiles
for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "authenticated read organizations" on public.organizations for select to authenticated using (true);
create policy "authenticated write organizations" on public.organizations for all to authenticated using (true) with check (true);
create policy "authenticated read contacts" on public.contacts for select to authenticated using (true);
create policy "authenticated write contacts" on public.contacts for all to authenticated using (true) with check (true);
create policy "authenticated read campaigns" on public.campaigns for select to authenticated using (true);
create policy "authenticated write campaigns" on public.campaigns for all to authenticated using (true) with check (true);
create policy "authenticated read campaign leads" on public.campaign_leads for select to authenticated using (true);
create policy "authenticated write campaign leads" on public.campaign_leads for all to authenticated using (true) with check (true);

create policy "authenticated read active packages" on public.product_packages
for select to authenticated
using (is_active or public.current_user_role() in ('admin', 'producer', 'manager'));

create policy "producer manages packages" on public.product_packages
for all to authenticated
using (public.current_user_role() in ('admin', 'producer'))
with check (public.current_user_role() in ('admin', 'producer'));

create policy "authenticated read product items" on public.product_items for select to authenticated using (true);
create policy "producer manages product items" on public.product_items
for all to authenticated
using (public.current_user_role() in ('admin', 'producer'))
with check (public.current_user_role() in ('admin', 'producer'));

create policy "authenticated read portfolio assets" on public.portfolio_assets for select to authenticated using (true);
create policy "producer manages portfolio assets" on public.portfolio_assets
for all to authenticated
using (public.current_user_role() in ('admin', 'producer'))
with check (public.current_user_role() in ('admin', 'producer'));

create policy "authenticated read mockup sources" on public.mockup_template_sources for select to authenticated using (true);
create policy "producer manages mockup sources" on public.mockup_template_sources
for all to authenticated using (public.current_user_role() in ('admin', 'producer')) with check (public.current_user_role() in ('admin', 'producer'));
create policy "authenticated read mockup templates" on public.mockup_templates for select to authenticated using (is_active or public.current_user_role() in ('admin', 'producer', 'manager'));
create policy "producer manages mockup templates" on public.mockup_templates
for all to authenticated using (public.current_user_role() in ('admin', 'producer')) with check (public.current_user_role() in ('admin', 'producer'));

create policy "authenticated read brand assets" on public.brand_assets for select to authenticated using (true);
create policy "authenticated write brand assets" on public.brand_assets for all to authenticated using (true) with check (true);
create policy "authenticated read brand variants" on public.brand_asset_variants for select to authenticated using (true);
create policy "authenticated write brand variants" on public.brand_asset_variants for all to authenticated using (true) with check (true);
create policy "authenticated read offers" on public.offers for select to authenticated using (true);
create policy "authenticated write offers" on public.offers for all to authenticated using (true) with check (true);
create policy "authenticated read offer assets" on public.offer_assets for select to authenticated using (true);
create policy "authenticated write offer assets" on public.offer_assets for all to authenticated using (true) with check (true);
create policy "authenticated read prototype briefs" on public.prototype_briefs for select to authenticated using (true);
create policy "authenticated write prototype briefs" on public.prototype_briefs for all to authenticated using (true) with check (true);
create policy "authenticated read prototype renders" on public.prototype_renders for select to authenticated using (true);
create policy "authenticated write prototype renders" on public.prototype_renders for all to authenticated using (true) with check (true);
create policy "authenticated read jobs" on public.jobs for select to authenticated using (true);
create policy "authenticated enqueue jobs" on public.jobs for insert to authenticated with check (true);
create policy "authenticated read messages" on public.messages for select to authenticated using (true);
create policy "authenticated prepare messages" on public.messages for insert to authenticated with check (status in ('draft', 'prepared'));
create policy "manager updates messages" on public.messages for update to authenticated
using (public.current_user_role() in ('admin', 'manager')) with check (public.current_user_role() in ('admin', 'manager'));
create policy "authenticated read deals" on public.deals for select to authenticated using (true);
create policy "manager manages deals" on public.deals for all to authenticated
using (public.current_user_role() in ('admin', 'manager')) with check (public.current_user_role() in ('admin', 'manager'));
create policy "authenticated read commissions" on public.commissions for select to authenticated using (profile_id = auth.uid() or public.current_user_role() in ('admin', 'manager'));
create policy "manager manages commissions" on public.commissions for all to authenticated
using (public.current_user_role() in ('admin', 'manager')) with check (public.current_user_role() in ('admin', 'manager'));
create policy "authenticated read audit events" on public.audit_events for select to authenticated using (public.current_user_role() in ('admin', 'manager'));
create policy "authenticated append audit events" on public.audit_events for insert to authenticated with check (actor_id = auth.uid() or actor_id is null);
create policy "authenticated read settings" on public.settings for select to authenticated using (true);
create policy "admin manages settings" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('portfolio-assets', 'portfolio-assets', true, 10485760, array['image/png', 'image/jpeg', 'image/webp']),
  ('company-logos', 'company-logos', false, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('mockup-sources', 'mockup-sources', false, 104857600, array['image/vnd.adobe.photoshop', 'application/octet-stream', 'application/zip']),
  ('mockup-templates', 'mockup-templates', false, 52428800, array['image/png', 'image/svg+xml', 'application/json']),
  ('generated-mockups', 'generated-mockups', false, 20971520, array['image/png', 'image/jpeg', 'image/webp']),
  ('offer-exports', 'offer-exports', false, 20971520, array['application/pdf', 'text/html', 'application/zip']),
  ('imports', 'imports', false, 10485760, array['text/csv', 'application/vnd.ms-excel', 'application/json'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "authenticated can read storage objects" on storage.objects
for select to authenticated
using (bucket_id in ('portfolio-assets', 'company-logos', 'mockup-sources', 'mockup-templates', 'generated-mockups', 'offer-exports', 'imports'));

create policy "authenticated can upload storage objects" on storage.objects
for insert to authenticated
with check (bucket_id in ('portfolio-assets', 'company-logos', 'mockup-sources', 'mockup-templates', 'generated-mockups', 'offer-exports', 'imports'));

create policy "authenticated can update own storage objects" on storage.objects
for update to authenticated
using (owner = auth.uid())
with check (owner = auth.uid());

insert into public.settings (key, value, description)
values
  ('outbound_sending_enabled', 'false'::jsonb, 'Global hard stop for real outbound messages. Keep false until legal and approval flow are complete.'),
  ('prototype_preview_watermark', '"PREVIEW - NOT APPROVED"'::jsonb, 'Watermark text for generated prototype previews.')
on conflict (key) do update set value = excluded.value, description = excluded.description, updated_at = now();
