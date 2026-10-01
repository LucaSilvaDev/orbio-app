-- Base mínima que as demais migrations assumem existir.
-- Estas tabelas foram criadas à mão no projeto de produção; este arquivo as versiona
-- para que uma instalação nova (ex.: Supabase self-hosted na VPS) funcione do zero.
-- Tudo é "if not exists": seguro de rodar sobre o banco atual.
-- CONFERIR contra produção assim que o projeto for reativado (colunas e políticas).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  role text not null default 'member',
  avatar_hue int not null default 222,
  initials text not null default '',
  email text
);

create table if not exists public.contact_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null default '',
  created_at timestamptz not null default now()
);

alter table public.contact_leads enable row level security;

drop policy if exists contact_leads_insert_public on public.contact_leads;
create policy contact_leads_insert_public on public.contact_leads
  for insert to anon, authenticated
  with check (true);
