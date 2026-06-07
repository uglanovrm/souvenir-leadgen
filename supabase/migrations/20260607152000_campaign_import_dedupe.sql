alter table public.organizations
add column if not exists inn text;

create unique index if not exists organizations_inn_unique_idx
on public.organizations(inn)
where inn is not null and inn <> '';

create unique index if not exists organizations_name_website_unique_idx
on public.organizations(lower(name), coalesce(website, ''))
where name is not null;
