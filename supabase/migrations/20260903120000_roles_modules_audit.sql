-- Fase 0: papéis, módulos restantes na nuvem, auditoria/lixeira, offboarding e Realtime.
-- Aplicar depois de 20260902180000_durable_store.sql.
--
-- Papéis (memberships.role):
--   owner   dono da empresa (único com poder total, inclusive promover admins)
--   admin   gerencia time, vê histórico e restaura exclusões
--   sales   edita CRM (empresas, contatos, deals, leads, tarefas…)
--   finance edita faturas e produtos
--   viewer  somente leitura (pode conversar no chat)
--   member  legado = sales

-- ---------------------------------------------------------------- membros
alter table public.memberships add column if not exists active boolean not null default true;
alter table public.memberships drop constraint if exists memberships_role_check;
alter table public.memberships
  add constraint memberships_role_check
  check (role in ('owner', 'admin', 'finance', 'sales', 'viewer', 'member'));

alter table public.invites add column if not exists role text not null default 'sales';
alter table public.invites drop constraint if exists invites_role_check;
alter table public.invites
  add constraint invites_role_check
  check (role in ('admin', 'finance', 'sales', 'viewer'));

-- Quem saiu da empresa deixa de ter acesso, mas o histórico (e o nome nos registros) fica.
create or replace function public.my_workspace_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id from public.memberships where user_id = auth.uid() and active;
$$;

create or replace function public.my_role(wid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.memberships
  where workspace_id = wid and user_id = auth.uid() and active;
$$;

create or replace function public.role_in(wid uuid, roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.my_role(wid) = any (roles), false);
$$;

create or replace function public.is_workspace_admin(wid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.role_in(wid, array['owner', 'admin']);
$$;

create or replace function public.is_workspace_owner(wid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.role_in(wid, array['owner']);
$$;

create or replace function public.can_edit_crm(wid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.role_in(wid, array['owner', 'admin', 'sales', 'member']);
$$;

create or replace function public.can_edit_finance(wid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.role_in(wid, array['owner', 'admin', 'finance']);
$$;

create or replace function public.can_write(wid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.role_in(wid, array['owner', 'admin', 'finance', 'sales', 'member']);
$$;

grant execute on function public.my_role(uuid) to authenticated;
grant execute on function public.role_in(uuid, text[]) to authenticated;
grant execute on function public.is_workspace_admin(uuid) to authenticated;
grant execute on function public.can_edit_crm(uuid) to authenticated;
grant execute on function public.can_edit_finance(uuid) to authenticated;
grant execute on function public.can_write(uuid) to authenticated;

-- Membros só nascem por RPC (security definer): ninguém se auto-promove inserindo linha.
drop policy if exists memberships_insert_owner on public.memberships;

drop policy if exists invites_insert_owner on public.invites;
drop policy if exists invites_insert_admin on public.invites;
create policy invites_insert_admin on public.invites
  for insert to authenticated
  with check (public.is_workspace_admin(workspace_id));

create or replace function public.ensure_my_workspace()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  wid uuid;
  meta_name text;
begin
  select workspace_id into wid
  from public.memberships
  where user_id = auth.uid() and active
  limit 1;
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

  insert into public.memberships (workspace_id, user_id, role, active)
  values (invite_row.workspace_id, auth.uid(), invite_row.role, true)
  on conflict (workspace_id, user_id) do update
    set active = true,
        role = case when public.memberships.role = 'owner' then 'owner' else excluded.role end;

  update public.invites
  set accepted_at = now()
  where id = invite_row.id;

  insert into public.profiles (id, name, role, avatar_hue, initials, email)
  values (
    auth.uid(),
    coalesce(auth.jwt() -> 'user_metadata' ->> 'name', split_part(user_email, '@', 1)),
    invite_row.role,
    200,
    upper(left(split_part(user_email, '@', 1), 2)),
    user_email
  )
  on conflict (id) do update
    set email = excluded.email,
        role = excluded.role;

  return invite_row.workspace_id;
end;
$$;

create or replace function public.set_member_role(wid uuid, target uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_role text;
begin
  if not public.is_workspace_admin(wid) then
    raise exception 'sem permissão';
  end if;
  if new_role not in ('admin', 'finance', 'sales', 'viewer') then
    raise exception 'papel inválido';
  end if;
  if new_role = 'admin' and public.my_role(wid) <> 'owner' then
    raise exception 'apenas o dono pode promover administradores';
  end if;

  select role into current_role
  from public.memberships
  where workspace_id = wid and user_id = target and active;
  if current_role is null then
    raise exception 'membro não encontrado';
  end if;
  if current_role = 'owner' then
    raise exception 'o papel do dono não pode ser alterado';
  end if;
  if current_role = 'admin' and public.my_role(wid) <> 'owner' then
    raise exception 'apenas o dono pode alterar administradores';
  end if;

  update public.memberships set role = new_role
  where workspace_id = wid and user_id = target;
  update public.profiles set role = new_role where id = target;
end;
$$;

-- Desligamento: o acesso acaba, os registros passam para outra pessoa, o histórico fica.
create or replace function public.offboard_member(wid uuid, target uuid, transfer_to uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role text;
begin
  if not public.is_workspace_admin(wid) then
    raise exception 'sem permissão';
  end if;
  if target = transfer_to then
    raise exception 'escolha outra pessoa para receber a carteira';
  end if;

  select role into target_role
  from public.memberships
  where workspace_id = wid and user_id = target and active;
  if target_role is null then
    raise exception 'membro não encontrado';
  end if;
  if target_role = 'owner' then
    raise exception 'o dono não pode ser desligado';
  end if;
  if target_role = 'admin' and public.my_role(wid) <> 'owner' then
    raise exception 'apenas o dono pode desligar administradores';
  end if;
  if not exists (
    select 1 from public.memberships
    where workspace_id = wid and user_id = transfer_to and active
  ) then
    raise exception 'quem recebe a carteira precisa ser membro ativo';
  end if;

  update public.companies set owner_id = transfer_to where workspace_id = wid and owner_id = target;
  update public.contacts set owner_id = transfer_to where workspace_id = wid and owner_id = target;
  update public.deals set owner_id = transfer_to where workspace_id = wid and owner_id = target;
  update public.workspace_items set owner_id = transfer_to where workspace_id = wid and owner_id = target;
  update public.documents set owner_id = transfer_to where workspace_id = wid and owner_id = target;
  update public.chat_threads
    set member_ids = array_remove(member_ids, target::text)
    where workspace_id = wid and kind = 'channel';

  delete from public.vault_ciphers where workspace_id = wid and user_id = target;
  update public.memberships set active = false where workspace_id = wid and user_id = target;
end;
$$;

grant execute on function public.set_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.offboard_member(uuid, uuid, uuid) to authenticated;

-- ---------------------------------------------------- módulos que viviam no navegador
create table if not exists public.workspace_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  kind text not null check (kind in (
    'lead', 'activity', 'product', 'campaign', 'note', 'reminder', 'event',
    'notification', 'flow_node', 'flow_edge', 'mind_node', 'report_layout'
  )),
  data jsonb not null default '{}'::jsonb,
  owner_id uuid references auth.users (id) on delete set null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_items_kind_idx on public.workspace_items (workspace_id, kind);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists workspace_items_touch on public.workspace_items;
create trigger workspace_items_touch
  before update on public.workspace_items
  for each row execute function public.touch_updated_at();

alter table public.workspace_items enable row level security;

drop policy if exists workspace_items_select on public.workspace_items;
create policy workspace_items_select on public.workspace_items
  for select to authenticated
  using (
    workspace_id in (select public.my_workspace_ids())
    and (
      kind <> 'notification'
      or coalesce(data ->> 'userId', '') = ''
      or data ->> 'userId' = auth.uid()::text
    )
  );

drop policy if exists workspace_items_insert on public.workspace_items;
create policy workspace_items_insert on public.workspace_items
  for insert to authenticated
  with check (
    workspace_id in (select public.my_workspace_ids())
    and public.can_write(workspace_id)
  );

drop policy if exists workspace_items_update on public.workspace_items;
create policy workspace_items_update on public.workspace_items
  for update to authenticated
  using (workspace_id in (select public.my_workspace_ids()) and public.can_write(workspace_id))
  with check (workspace_id in (select public.my_workspace_ids()) and public.can_write(workspace_id));

drop policy if exists workspace_items_delete on public.workspace_items;
create policy workspace_items_delete on public.workspace_items
  for delete to authenticated
  using (workspace_id in (select public.my_workspace_ids()) and public.can_write(workspace_id));

-- ------------------------------------------------ permissões por papel no CRM e financeiro
do $$
declare
  t text;
begin
  foreach t in array array['companies', 'contacts', 'deals'] loop
    execute format('drop policy if exists %I on public.%I', t || '_all', t);
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);

    execute format(
      'create policy %I on public.%I for select to authenticated using (workspace_id in (select public.my_workspace_ids()))',
      t || '_select', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (workspace_id in (select public.my_workspace_ids()) and public.can_edit_crm(workspace_id))',
      t || '_insert', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (workspace_id in (select public.my_workspace_ids()) and public.can_edit_crm(workspace_id)) with check (workspace_id in (select public.my_workspace_ids()) and public.can_edit_crm(workspace_id))',
      t || '_update', t);
    -- vendedor só exclui o que é dele; admin/dono excluem qualquer registro
    execute format(
      'create policy %I on public.%I for delete to authenticated using (workspace_id in (select public.my_workspace_ids()) and public.can_edit_crm(workspace_id) and (public.is_workspace_admin(workspace_id) or owner_id = auth.uid()))',
      t || '_delete', t);
  end loop;
end $$;

drop policy if exists invoices_all on public.invoices;
drop policy if exists invoices_select on public.invoices;
drop policy if exists invoices_write on public.invoices;
create policy invoices_select on public.invoices
  for select to authenticated
  using (workspace_id in (select public.my_workspace_ids()));
create policy invoices_write on public.invoices
  for all to authenticated
  using (workspace_id in (select public.my_workspace_ids()) and public.can_edit_finance(workspace_id))
  with check (workspace_id in (select public.my_workspace_ids()) and public.can_edit_finance(workspace_id));

drop policy if exists documents_insert on public.documents;
create policy documents_insert on public.documents
  for insert to authenticated
  with check (
    workspace_id in (select public.my_workspace_ids())
    and owner_id = auth.uid()
    and public.can_write(workspace_id)
  );

-- --------------------------------------------------------------- auditoria e lixeira
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  workspace_id uuid not null,
  actor uuid,
  table_name text not null,
  row_id text,
  action text not null check (action in ('insert', 'update', 'delete')),
  old_data jsonb,
  new_data jsonb,
  at timestamptz not null default now()
);

create index if not exists audit_workspace_at_idx on public.audit_log (workspace_id, at desc);

alter table public.audit_log enable row level security;

drop policy if exists audit_select_admin on public.audit_log;
create policy audit_select_admin on public.audit_log
  for select to authenticated
  using (public.is_workspace_admin(workspace_id));

create or replace function public.audit_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rec jsonb;
begin
  if tg_op = 'DELETE' then
    rec := to_jsonb(old);
  else
    rec := to_jsonb(new);
  end if;

  -- ruído: arrastar nó de mapa, notificações e layout de relatório não entram no histórico
  if tg_table_name = 'workspace_items'
     and rec ->> 'kind' in ('notification', 'flow_node', 'flow_edge', 'mind_node', 'report_layout') then
    return null;
  end if;

  if tg_op = 'UPDATE' and to_jsonb(old) = to_jsonb(new) then
    return null;
  end if;

  insert into public.audit_log (workspace_id, actor, table_name, row_id, action, old_data, new_data)
  values (
    (rec ->> 'workspace_id')::uuid,
    auth.uid(),
    tg_table_name,
    coalesce(rec ->> 'id', rec ->> 'user_id'),
    lower(tg_op),
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end
  );
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['companies', 'contacts', 'deals', 'invoices', 'documents', 'workspace_items', 'memberships'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_audit', t);
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_row()',
      t || '_audit', t);
  end loop;
end $$;

create or replace function public.restore_audit_row(audit_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.audit_log%rowtype;
begin
  select * into a from public.audit_log where id = audit_id;
  if a.id is null then
    raise exception 'registro não encontrado';
  end if;
  if not public.is_workspace_admin(a.workspace_id) then
    raise exception 'sem permissão';
  end if;
  if a.action <> 'delete' or a.old_data is null then
    raise exception 'apenas exclusões podem ser restauradas';
  end if;
  if a.table_name not in ('companies', 'contacts', 'deals', 'invoices', 'workspace_items') then
    raise exception 'este tipo de registro não pode ser restaurado';
  end if;

  execute format(
    'insert into public.%I select (jsonb_populate_record(null::public.%I, $1)).* on conflict do nothing',
    a.table_name, a.table_name
  ) using a.old_data;
end;
$$;

grant execute on function public.restore_audit_row(bigint) to authenticated;

-- ------------------------------------------------------------------------ Realtime
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array[
      'chat_messages', 'chat_threads', 'workspace_items',
      'deals', 'contacts', 'companies', 'documents', 'invoices'
    ] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;
