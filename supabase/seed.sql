insert into public.product_packages (
  id,
  name,
  slug,
  description,
  technology,
  min_quantity,
  price_from,
  production_days,
  target_industries,
  margin_percent,
  is_active
)
values (
  '00000000-0000-4000-8000-000000000101',
  'Welcome merch starter pack',
  'welcome-merch-starter-pack',
  'Lean package for HR, events, and client onboarding: mug, sticker sheet, and notebook.',
  'UV print and digital transfer',
  50,
  790.00,
  7,
  array['hr', 'events', 'education'],
  25.00,
  true
)
on conflict (slug) do update set
  description = excluded.description,
  technology = excluded.technology,
  min_quantity = excluded.min_quantity,
  price_from = excluded.price_from,
  production_days = excluded.production_days,
  target_industries = excluded.target_industries,
  margin_percent = excluded.margin_percent,
  is_active = excluded.is_active;

insert into public.product_items (
  package_id,
  name,
  sku,
  description,
  price_from,
  sort_order,
  is_active
)
values
  ('00000000-0000-4000-8000-000000000101', 'Ceramic mug with logo', 'MUG-STARTER', 'White mug with one-sided logo placement.', 290.00, 10, true),
  ('00000000-0000-4000-8000-000000000101', 'Sticker sheet', 'STICKER-STARTER', 'A5 sticker sheet with simple die-cut shapes.', 120.00, 20, true),
  ('00000000-0000-4000-8000-000000000101', 'Notebook', 'NOTEBOOK-STARTER', 'A5 softcover notebook with branded cover.', 380.00, 30, true);

insert into public.campaigns (
  id,
  name,
  description,
  status,
  target_industries
)
values (
  '00000000-0000-4000-8000-000000000201',
  'Demo HR onboarding leads',
  'Demo campaign for testing product matching and offer draft flow.',
  'draft',
  array['hr', 'education']
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  target_industries = excluded.target_industries;

insert into public.mockup_template_sources (
  id,
  name,
  source_bucket,
  source_path,
  source_kind,
  notes
)
values (
  '00000000-0000-4000-8000-000000000301',
  'Demo mug PSD source',
  'mockup-sources',
  'demo/mug/source.psd',
  'psd',
  'PSD is kept as source only; runtime uses exported mockup pack.'
)
on conflict (source_bucket, source_path) do update set
  name = excluded.name,
  notes = excluded.notes;

insert into public.mockup_templates (
  id,
  source_id,
  name,
  product_package_id,
  template_bucket,
  template_prefix,
  preview_path,
  metadata,
  is_active
)
values (
  '00000000-0000-4000-8000-000000000302',
  '00000000-0000-4000-8000-000000000301',
  'Demo mug front view',
  '00000000-0000-4000-8000-000000000101',
  'mockup-templates',
  'demo/mug/front',
  'demo/mug/front/preview.png',
  '{"required_files":["base.png","mask.png","shadow.png","highlight.png","template.json"],"safe_area":{"x":420,"y":310,"width":520,"height":360}}'::jsonb,
  true
)
on conflict (template_bucket, template_prefix) do update set
  name = excluded.name,
  product_package_id = excluded.product_package_id,
  preview_path = excluded.preview_path,
  metadata = excluded.metadata,
  is_active = excluded.is_active;
