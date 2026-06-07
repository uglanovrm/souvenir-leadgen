alter table public.mockup_template_sources
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'normalized', 'certified', 'rejected')),
  add column if not exists author text,
  add column if not exists license text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists mockup_template_sources_status_idx
  on public.mockup_template_sources(status);
