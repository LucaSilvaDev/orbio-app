// Valida as migrations e a RLS num Postgres real (PGlite, em WebAssembly) com stubs do Supabase.
// Cenário: dono, vendedor, leitor e uma empresa de fora.
import { describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

describe("migrations + RLS", () => {
  it("isola empresas, aplica papéis, audita e desliga funcionário", async () => {
    const db = new PGlite();
    const dir = fileURLToPath(new URL("../migrations/", import.meta.url));
// ---- Supabase stubs
await db.exec(`
create schema auth;
create schema storage;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.sub', true), '')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$
  select jsonb_build_object('email', current_setting('request.jwt.email', true), 'user_metadata', jsonb_build_object('name', current_setting('request.jwt.name', true)))
$$;
create role anon; create role authenticated;
grant usage on schema public, auth to anon, authenticated;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint);
create table storage.objects (id uuid default gen_random_uuid() primary key, bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
create publication supabase_realtime;
`);

for (const f of fs.readdirSync(dir).sort()) {
  try {
    await db.exec(fs.readFileSync(dir + f, "utf8"));
    
  } catch (e) {
    console.error("FAIL", f, e.message);
    throw new Error("migration falhou: " + f);
  }
}

await db.exec(`grant all on all tables in schema public to authenticated; grant all on all sequences in schema public to authenticated;`);

const A = "00000000-0000-0000-0000-00000000000a"; // owner
const B = "00000000-0000-0000-0000-00000000000b"; // sales
const C = "00000000-0000-0000-0000-00000000000c"; // viewer
const D = "00000000-0000-0000-0000-00000000000d"; // outsider (other company)
for (const [id, n] of [[A, "Ana"], [B, "Bia"], [C, "Caio"], [D, "Duda"]]) {
  await db.query("insert into auth.users(id,email) values ($1,$2)", [id, n.toLowerCase() + "@x.com"]);
}

async function as(user, fn) {
  await db.exec(`set role authenticated; select set_config('request.jwt.sub','${user.id}',false), set_config('request.jwt.email','${user.email}',false), set_config('request.jwt.name','${user.name}',false);`);
  try { return await fn(); } finally { await db.exec("reset role"); }
}
const ua = { id: A, email: "ana@x.com", name: "Ana" };
const ub = { id: B, email: "bia@x.com", name: "Bia" };
const uc = { id: C, email: "caio@x.com", name: "Caio" };
const ud = { id: D, email: "duda@x.com", name: "Duda" };

let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { (cond ? pass++ : fail++); if (!cond) console.error("FALHOU:", name, extra); };
const tryq = async (sql, params) => { try { return { r: await db.query(sql, params) }; } catch (e) { return { e: e.message }; } };

// workspace + membros
const W = (await as(ua, () => db.query("select public.ensure_my_workspace() as w"))).rows[0].w;
const W2 = (await as(ud, () => db.query("select public.ensure_my_workspace() as w"))).rows[0].w;
await db.query("insert into public.invites(workspace_id,email,token,role) values ($1,'bia@x.com','tb','sales'),($1,'caio@x.com','tc','viewer')", [W]);
await as(ub, () => db.query("select public.accept_invite('tb')"));
await as(uc, () => db.query("select public.accept_invite('tc')"));
console.log("\n== Papéis e RLS");

let q = await as(ub, () => tryq("insert into public.deals(workspace_id,name,owner_id) values ($1,'Deal da Bia',$2) returning id", [W, B]));
ok("vendedor cria deal", !q.e, q.e);
const dealB = q.r?.rows[0].id;
q = await as(uc, () => tryq("insert into public.deals(workspace_id,name) values ($1,'x')", [W]));
ok("leitor NÃO cria deal", !!q.e);
q = await as(uc, () => tryq("select count(*)::int c from public.deals"));
ok("leitor lê deals", q.r?.rows[0].c === 1);
q = await as(ud, () => tryq("select count(*)::int c from public.deals"));
ok("outra empresa NÃO vê deals", q.r?.rows[0].c === 0);
q = await as(ud, () => tryq("insert into public.deals(workspace_id,name) values ($1,'invasão')", [W]));
ok("outra empresa NÃO escreve na empresa alheia", !!q.e);

await as(ua, () => db.query("insert into public.deals(workspace_id,name,owner_id) values ($1,'Deal da Ana',$2)", [W, A]));
q = await as(ub, () => db.query("delete from public.deals where name='Deal da Ana' returning id"));
ok("vendedor NÃO apaga deal de outro", q.rows.length === 0);
q = await as(ub, () => db.query("delete from public.deals where id=$1 returning id", [dealB]));
ok("vendedor apaga o próprio deal", q.rows.length === 1);

q = await as(ub, () => tryq("insert into public.invoices(workspace_id,number) values ($1,'F1')", [W]));
ok("vendedor NÃO cria fatura", !!q.e);
q = await as(ua, () => tryq("insert into public.invoices(workspace_id,number) values ($1,'F1')", [W]));
ok("dono cria fatura", !q.e, q.e);

q = await as(ub, () => tryq("insert into public.workspace_items(workspace_id,kind,data,owner_id) values ($1,'lead','{\"name\":\"L\"}',$2)", [W, B]));
ok("vendedor cria lead (workspace_items)", !q.e, q.e);
q = await as(uc, () => tryq("insert into public.workspace_items(workspace_id,kind,data) values ($1,'lead','{}')", [W]));
ok("leitor NÃO cria lead", !!q.e);
await as(ua, () => db.query(`insert into public.workspace_items(workspace_id,kind,data) values ($1,'notification',$2)`, [W, JSON.stringify({ title: "só pra Bia", userId: B })]));
q = await as(uc, () => tryq("select count(*)::int c from public.workspace_items where kind='notification'"));
ok("notificação de outro usuário fica invisível", q.r?.rows[0].c === 0);
q = await as(ub, () => tryq("select count(*)::int c from public.workspace_items where kind='notification'"));
ok("notificação aparece para o destinatário", q.r?.rows[0].c === 1);

q = await as(ub, () => tryq("insert into public.memberships(workspace_id,user_id,role) values ($1,$2,'owner')", [W, D]));
ok("ninguém insere membership direto", !!q.e);
q = await as(ub, () => tryq("select public.set_member_role($1,$2,'admin')", [W, C]));
ok("vendedor NÃO muda papéis", !!q.e);
q = await as(ua, () => tryq("select public.set_member_role($1,$2,'finance')", [W, C]));
ok("dono muda papel", !q.e, q.e);
q = await as(uc, () => tryq("insert into public.invoices(workspace_id,number) values ($1,'F2')", [W]));
ok("financeiro cria fatura após promoção", !q.e, q.e);

console.log("\n== Auditoria e lixeira");
q = await as(ub, () => tryq("select count(*)::int c from public.audit_log"));
ok("vendedor NÃO lê auditoria", q.r?.rows[0].c === 0);
q = await as(ua, () => tryq("select action, table_name from public.audit_log where table_name='deals' order by id"));
console.log("     histórico de deals:", JSON.stringify(q.r?.rows));
ok("auditoria registrou insert/delete de deal", q.r?.rows.some((r) => r.action === "delete"));
q = await as(ua, () => tryq("select count(*)::int c from public.audit_log where table_name='workspace_items' and old_data->>'kind'='notification'"));
ok("notificações fora da auditoria", q.r?.rows[0].c === 0);
const del = (await as(ua, () => db.query("select id from public.audit_log where table_name='deals' and action='delete'"))).rows[0].id;
q = await as(ub, () => tryq("select public.restore_audit_row($1)", [del]));
ok("vendedor NÃO restaura", !!q.e);
q = await as(ua, () => tryq("select public.restore_audit_row($1)", [del]));
ok("dono restaura exclusão", !q.e, q.e);
q = await as(ua, () => tryq("select count(*)::int c from public.deals where name='Deal da Bia'"));
ok("deal restaurado", q.r?.rows[0].c === 1);

console.log("\n== Desligamento de funcionário");
await as(ua, () => db.query("update public.deals set owner_id=$2 where name='Deal da Bia' and workspace_id=$1", [W, B]));
q = await as(ub, () => tryq("select public.offboard_member($1,$2,$3)", [W, A, B]));
ok("vendedor NÃO desliga ninguém", !!q.e);
q = await as(ua, () => tryq("select public.offboard_member($1,$2,$2)", [W, B]));
ok("transferir para si mesmo é recusado", !!q.e);
q = await as(ua, () => tryq("select public.offboard_member($1,$2,$3)", [W, B, A]));
ok("dono desliga vendedor e transfere carteira", !q.e, q.e);
q = await as(ua, () => tryq("select owner_id from public.deals where name='Deal da Bia'"));
ok("deal passou para a Ana", q.r?.rows[0].owner_id === A);
q = await as(ub, () => tryq("select count(*)::int c from public.deals"));
ok("ex-funcionário perdeu o acesso", q.r?.rows[0].c === 0);
q = await as(ub, () => tryq("select public.ensure_my_workspace() w"));
ok("ex-funcionário recebe workspace próprio (não o antigo)", q.r?.rows[0].w !== W);
q = await as(ua, () => tryq("select count(*)::int c from public.profiles where id=$1", [B]));
ok("nome do ex-funcionário continua visível ao time", q.r?.rows[0].c === 1);
q = await as(ua, () => tryq("select public.offboard_member($1,$2,$3)", [W, A, C]));
ok("dono não pode ser desligado", !!q.e);

console.log("\n== Realtime");
q = await db.query("select tablename from pg_publication_tables where pubname='supabase_realtime' order by 1");
console.log("    ", q.rows.map((r) => r.tablename).join(", "));
ok("8 tabelas publicadas", q.rows.length === 8);

console.log(`\nRESULTADO: ${pass} ok, ${fail} falhas`);
expect(fail, `${fail} verificações falharam`).toBe(0);
  }, 120_000);
});
