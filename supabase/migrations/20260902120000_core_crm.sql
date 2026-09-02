-- Núcleo comercial compartilhado: workspace, membros, empresas, contatos, deals.
-- O restante do CRM continua no cliente até a próxima leva.

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Orbio',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null,
  token text not null unique,
  invited_by uuid references auth.users (id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  domain text not null default '',
  cnpj text not null default '',
  industry text not null default '',
  employees text not null default '',
  city text not null default '',
  country text not null default 'Brasil',
  arr numeric not null default 0,
  health int not null default 70,
  owner_id uuid,
  tags text[] not null default '{}',
  created_at date not null default current_date
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  title text not null default '',
  email text not null default '',
  phone text not null default '',
  company_id uuid references public.companies (id) on delete set null,
  owner_id uuid,
  location text not null default '',
  last_touch date,
  score int not null default 50,
  tags text[] not null default '{}'
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  company_id uuid references public.companies (id) on delete set null,
  contact_id uuid references public.contacts (id) on delete set null,
  owner_id uuid,
  stage text not null default 'qualification',
  value numeric not null default 0,
  probability int not null default 20,
  close_date date,
  priority text not null default 'medium',
  source text not null default '',
  next_step text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;

create index if not exists companies_workspace_idx on public.companies (workspace_id);
create index if not exists contacts_workspace_idx on public.contacts (workspace_id);
create index if not exists deals_workspace_idx on public.deals (workspace_id);
create index if not exists memberships_user_idx on public.memberships (user_id);
create index if not exists invites_token_idx on public.invites (token);

create or replace function public.my_workspace_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id from public.memberships where user_id = auth.uid();
$$;

create or replace function public.is_workspace_owner(wid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where workspace_id = wid and user_id = auth.uid() and role = 'owner'
  );
$$;

create or replace function public.ensure_my_workspace()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  wid uuid;
  invite_row public.invites%rowtype;
  meta_name text;
begin
  select workspace_id into wid from public.memberships where user_id = auth.uid() limit 1;
  if wid is not null then
    return wid;
  end if;

  meta_name := coalesce(auth.jwt() -> 'user_metadata' ->> 'name', 'Orbio');

  insert into public.workspaces (name, created_by)
  values (meta_name, auth.uid())
  returning id into wid;

  insert into public.memberships (workspace_id, user_id, role)
  values (wid, auth.uid(), 'owner');

  insert into public.profiles (id, name, role, avatar_hue, initials, email)
  values (
    auth.uid(),
    meta_name,
    'owner',
    222,
    upper(left(meta_name, 2)),
    coalesce(auth.jwt() ->> 'email', '')
  )
  on conflict (id) do update
    set email = excluded.email;

  return wid;
end;
$$;

create or replace function public.accept_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_row public.invites%rowtype;
  user_email text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  user_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  select * into invite_row
  from public.invites
  where token = invite_token
    and accepted_at is null
  limit 1;

  if invite_row.id is null then
    raise exception 'convite inválido';
  end if;

  if invite_row.email is not null and lower(invite_row.email) <> user_email then
    raise exception 'este convite é para outro e-mail';
  end if;

  insert into public.memberships (workspace_id, user_id, role)
  values (invite_row.workspace_id, auth.uid(), 'member')
  on conflict (workspace_id, user_id) do nothing;

  update public.invites
  set accepted_at = now()
  where id = invite_row.id;

  insert into public.profiles (id, name, role, avatar_hue, initials, email)
  values (
    auth.uid(),
    coalesce(auth.jwt() -> 'user_metadata' ->> 'name', split_part(user_email, '@', 1)),
    'member',
    200,
    upper(left(split_part(user_email, '@', 1), 2)),
    user_email
  )
  on conflict (id) do update
    set email = excluded.email;

  return invite_row.workspace_id;
end;
$$;

create or replace function public.handle_new_user_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_name text;
begin
  meta_name := coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Orbio');

  insert into public.profiles (id, name, role, avatar_hue, initials, email)
  values (
    new.id,
    meta_name,
    'member',
    222,
    upper(left(meta_name, 2)),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(public.profiles.name, excluded.name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_workspace on auth.users;
create trigger on_auth_user_workspace
  after insert on auth.users
  for each row execute function public.handle_new_user_workspace();

alter table public.workspaces enable row level security;
alter table public.memberships enable row level security;
alter table public.invites enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.deals enable row level security;

drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces
  for select to authenticated
  using (id in (select public.my_workspace_ids()));

drop policy if exists memberships_select on public.memberships;
create policy memberships_select on public.memberships
  for select to authenticated
  using (workspace_id in (select public.my_workspace_ids()));

drop policy if exists memberships_insert_owner on public.memberships;
create policy memberships_insert_owner on public.memberships
  for insert to authenticated
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists invites_select on public.invites;
create policy invites_select on public.invites
  for select to authenticated
  using (workspace_id in (select public.my_workspace_ids()));

drop policy if exists invites_insert_owner on public.invites;
create policy invites_insert_owner on public.invites
  for insert to authenticated
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists companies_all on public.companies;
create policy companies_all on public.companies
  for all to authenticated
  using (workspace_id in (select public.my_workspace_ids()))
  with check (workspace_id in (select public.my_workspace_ids()));

drop policy if exists contacts_all on public.contacts;
create policy contacts_all on public.contacts
  for all to authenticated
  using (workspace_id in (select public.my_workspace_ids()))
  with check (workspace_id in (select public.my_workspace_ids()));

drop policy if exists deals_all on public.deals;
create policy deals_all on public.deals
  for all to authenticated
  using (workspace_id in (select public.my_workspace_ids()))
  with check (workspace_id in (select public.my_workspace_ids()));

grant execute on function public.ensure_my_workspace() to authenticated;
grant execute on function public.accept_invite(text) to authenticated;
grant execute on function public.my_workspace_ids() to authenticated;
grant execute on function public.is_workspace_owner(uuid) to authenticated;

alter table public.profiles enable row level security;

drop policy if exists profiles_select_members on public.profiles;
create policy profiles_select_members on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or id in (
      select m2.user_id
      from public.memberships m1
      join public.memberships m2 on m1.workspace_id = m2.workspace_id
      where m1.user_id = auth.uid()
    )
  );

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
