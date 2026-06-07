alter table public.mockup_templates
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'certified', 'rejected')),
  add column if not exists product_type text,
  add column if not exists technology text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists quality_score numeric(5,2) check (quality_score is null or quality_score >= 0);

create index if not exists mockup_templates_status_idx on public.mockup_templates(status);
create index if not exists mockup_templates_product_type_idx on public.mockup_templates(product_type);
create index if not exists mockup_templates_tags_idx on public.mockup_templates using gin(tags);
