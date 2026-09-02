-- Arquivos, faturas, chat e ciphertext do cofre.
-- Bucket privado `workspace`. Boleto/PDF nunca vai no Postgres.
-- Aplicar no SQL Editor depois de 20260902120000_core_crm.sql.

insert into storage.buckets (id, name, public, file_size_limit)
values ('workspace', 'workspace', false, 52428800)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  kind text not null default 'file',
  related text not null default '',
  updated_at date not null default current_date,
  owner_id uuid not null references auth.users (id) on delete cascade,
  size_label text not null default '',
  size_bytes bigint not null default 0,
  mime text not null default '',
  file_name text not null default '',
  storage_path text not null default '',
  sha256 text not null default '',
  share_mode text not null default 'private' check (share_mode in ('private', 'people', 'team')),
  shared_with text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  number text not null,
  company_id uuid references public.companies (id) on delete set null,
  deal_id uuid references public.deals (id) on delete set null,
  amount numeric not null default 0,
  status text not null default 'draft',
  issued_at date,
  due_at date,
  file_path text not null default '',
  file_name text not null default '',
  file_mime text not null default '',
  file_hash text not null default '',
  file_size bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  kind text not null check (kind in ('dm', 'channel')),
  name text,
  member_ids text[] not null default '{}',
  unread_by text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  thread_id uuid not null references public.chat_threads (id) on delete cascade,
  author_id text not null,
  body text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.vault_ciphers (
  user_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  v int not null default 1,
  salt text not null,
  iv text not null,
  iter int not null,
  data text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, workspace_id)
);

create index if not exists documents_workspace_idx on public.documents (workspace_id);
create index if not exists invoices_workspace_idx on public.invoices (workspace_id);
create index if not exists chat_threads_workspace_idx on public.chat_threads (workspace_id);
create index if not exists chat_messages_thread_idx on public.chat_messages (thread_id);

alter table public.documents enable row level security;
alter table public.invoices enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.vault_ciphers enable row level security;

drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents
  for select to authenticated
  using (
    workspace_id in (select public.my_workspace_ids())
    and (
      owner_id = auth.uid()
      or share_mode = 'team'
      or (share_mode = 'people' and auth.uid()::text = any (shared_with))
    )
  );

drop policy if exists documents_insert on public.documents;
create policy documents_insert on public.documents
  for insert to authenticated
  with check (
    workspace_id in (select public.my_workspace_ids())
    and owner_id = auth.uid()
  );

drop policy if exists documents_update on public.documents;
create policy documents_update on public.documents
  for update to authenticated
  using (owner_id = auth.uid() and workspace_id in (select public.my_workspace_ids()))
  with check (owner_id = auth.uid() and workspace_id in (select public.my_workspace_ids()));

drop policy if exists documents_delete on public.documents;
create policy documents_delete on public.documents
  for delete to authenticated
  using (owner_id = auth.uid() and workspace_id in (select public.my_workspace_ids()));

drop policy if exists invoices_all on public.invoices;
create policy invoices_all on public.invoices
  for all to authenticated
  using (workspace_id in (select public.my_workspace_ids()))
  with check (workspace_id in (select public.my_workspace_ids()));

drop policy if exists chat_threads_all on public.chat_threads;
create policy chat_threads_all on public.chat_threads
  for all to authenticated
  using (
    workspace_id in (select public.my_workspace_ids())
    and auth.uid()::text = any (member_ids)
  )
  with check (
    workspace_id in (select public.my_workspace_ids())
    and auth.uid()::text = any (member_ids)
  );

drop policy if exists chat_messages_all on public.chat_messages;
create policy chat_messages_all on public.chat_messages
  for all to authenticated
  using (
    exists (
      select 1
      from public.chat_threads t
      where t.id = thread_id
        and t.workspace_id in (select public.my_workspace_ids())
        and auth.uid()::text = any (t.member_ids)
    )
  )
  with check (
    exists (
      select 1
      from public.chat_threads t
      where t.id = thread_id
        and t.workspace_id in (select public.my_workspace_ids())
        and auth.uid()::text = any (t.member_ids)
    )
  );

drop policy if exists vault_ciphers_self on public.vault_ciphers;
create policy vault_ciphers_self on public.vault_ciphers
  for all to authenticated
  using (user_id = auth.uid() and workspace_id in (select public.my_workspace_ids()))
  with check (user_id = auth.uid() and workspace_id in (select public.my_workspace_ids()));

drop policy if exists workspace_objects_select on storage.objects;
create policy workspace_objects_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'workspace'
    and (storage.foldername(name))[1] in (select public.my_workspace_ids()::text)
    and (
      (
        (storage.foldername(name))[2] = 'vault'
        and (storage.foldername(name))[3] = auth.uid()::text
      )
      or (
        (storage.foldername(name))[2] = 'docs'
        and (
          owner = auth.uid()
          or exists (
            select 1
            from public.documents d
            where d.storage_path = name
              and (
                d.owner_id = auth.uid()
                or d.share_mode = 'team'
                or (d.share_mode = 'people' and auth.uid()::text = any (d.shared_with))
              )
          )
        )
      )
      or (
        (storage.foldername(name))[2] = 'invoices'
      )
      or (
        (storage.foldername(name))[2] = 'chat'
        and (
          owner = auth.uid()
          or exists (
            select 1
            from public.chat_messages m
            join public.chat_threads t on t.id = m.thread_id
            where m.id::text = (storage.foldername(name))[3]
              and auth.uid()::text = any (t.member_ids)
          )
        )
      )
    )
  );

drop policy if exists workspace_objects_insert on storage.objects;
create policy workspace_objects_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'workspace'
    and (storage.foldername(name))[1] in (select public.my_workspace_ids()::text)
    and (
      (storage.foldername(name))[2] in ('docs', 'invoices', 'chat')
      or (
        (storage.foldername(name))[2] = 'vault'
        and (storage.foldername(name))[3] = auth.uid()::text
      )
    )
  );

drop policy if exists workspace_objects_update on storage.objects;
create policy workspace_objects_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'workspace'
    and owner = auth.uid()
    and (storage.foldername(name))[1] in (select public.my_workspace_ids()::text)
  )
  with check (
    bucket_id = 'workspace'
    and (storage.foldername(name))[1] in (select public.my_workspace_ids()::text)
  );

drop policy if exists workspace_objects_delete on storage.objects;
create policy workspace_objects_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'workspace'
    and (storage.foldername(name))[1] in (select public.my_workspace_ids()::text)
    and (
      owner = auth.uid()
      or (
        (storage.foldername(name))[2] = 'vault'
        and (storage.foldername(name))[3] = auth.uid()::text
      )
      or exists (
        select 1 from public.documents d
        where d.storage_path = name and d.owner_id = auth.uid()
      )
      or (storage.foldername(name))[2] = 'invoices'
      or exists (
        select 1
        from public.chat_messages m
        join public.chat_threads t on t.id = m.thread_id
        where m.id::text = (storage.foldername(name))[3]
          and auth.uid()::text = any (t.member_ids)
      )
    )
  );
