import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { History, RotateCcw, UserMinus } from "lucide-react";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { listUsers, refreshUsers } from "@/lib/directory";
import { useCrm } from "@/store/useCrm";
import { useUi } from "@/store/useUi";
import { isAdmin, ROLE_HINT, ROLE_LABEL, usePermissions, type Role } from "@/store/usePermissions";
import { brl, cn } from "@/lib/cn";
import { getWorkspace } from "@/lib/workspace";
import { createInvite, inviteUrl } from "@/services/invites";
import {
  loadAudit,
  loadMembers,
  offboardMember,
  restoreAudit,
  setMemberRole,
  type AuditEntry,
  type Member,
} from "@/services/team";
import type { User } from "@/types";

const select =
  "h-10 w-full rounded-pill bg-midnight-ink/5 px-3 text-[13px] text-midnight-ink outline-none focus:shadow-focus";

const TABLE_LABEL: Record<string, string> = {
  companies: "Empresa",
  contacts: "Pessoa",
  deals: "Oportunidade",
  invoices: "Fatura",
  documents: "Documento",
  memberships: "Membro",
};
const KIND_LABEL: Record<string, string> = {
  lead: "Lead",
  activity: "Tarefa",
  product: "Produto",
  campaign: "Campanha",
  note: "Nota",
  reminder: "Lembrete",
  event: "Evento",
};
const ACTION_LABEL = { insert: "criou", update: "alterou", delete: "excluiu" } as const;
const RESTORABLE = new Set(["companies", "contacts", "deals", "invoices", "workspace_items"]);

function describe(entry: AuditEntry) {
  const row = entry.newData ?? entry.oldData ?? {};
  const data = (row.data as Record<string, unknown> | undefined) ?? {};
  const kind = typeof row.kind === "string" ? KIND_LABEL[row.kind] : undefined;
  const type = entry.tableName === "workspace_items" ? (kind ?? "Item") : (TABLE_LABEL[entry.tableName] ?? entry.tableName);
  const name = String(row.name ?? row.number ?? data.name ?? data.title ?? data.body ?? "").slice(0, 60);
  return { type, name };
}

export function TeamPage() {
  const deals = useCrm((s) => s.deals);
  const activities = useCrm((s) => s.activities);
  const pushToast = useUi((s) => s.pushToast);
  const role = usePermissions((s) => s.role);
  const [users, setUsers] = useState<User[]>(listUsers());
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("sales");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [leaving, setLeaving] = useState<User | null>(null);
  const [heir, setHeir] = useState("");
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const official = getWorkspace() === "official";
  const admin = official && isAdmin(role);

  const refresh = useCallback(async () => {
    setUsers(await refreshUsers());
    if (official) setMembers(await loadMembers());
  }, [official]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (admin) void loadAudit().then(setAudit);
  }, [admin]);

  const roleOf = useMemo(() => new Map(members.map((m) => [m.userId, m])), [members]);
  const nameOf = useMemo(() => new Map(users.map((u) => [u.id, u.name])), [users]);
  const active = official && members.length ? users.filter((u) => roleOf.get(u.id)?.active) : users;
  const former = official ? users.filter((u) => roleOf.get(u.id) && !roleOf.get(u.id)!.active) : [];

  async function onInvite(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    const result = await createInvite(email, inviteRole);
    setSending(false);
    if (result.error || !result.token) {
      pushToast(result.error ?? "Não deu para convidar");
      return;
    }
    const url = inviteUrl(result.token);
    setLink(url);
    await navigator.clipboard.writeText(url).catch(() => undefined);
    pushToast("Link copiado. Manda no e-mail da pessoa.");
    setEmail("");
  }

  async function changeRole(userId: string, next: string) {
    const error = await setMemberRole(userId, next);
    pushToast(error ?? "Papel atualizado");
    void refresh();
  }

  async function confirmOffboard() {
    if (!leaving || !heir) return;
    const error = await offboardMember(leaving.id, heir);
    if (error) {
      pushToast(error);
      return;
    }
    pushToast(`${leaving.name} foi desligado(a). A carteira passou para ${nameOf.get(heir) ?? "outra pessoa"}.`);
    setLeaving(null);
    setHeir("");
    void refresh();
    void loadAudit().then(setAudit);
  }

  async function restore(entry: AuditEntry) {
    const error = await restoreAudit(entry.id);
    pushToast(error ?? "Registro restaurado");
    if (!error) void loadAudit().then(setAudit);
  }

  const inviteRoles = isAdmin(role) && role === "owner" ? ["admin", "finance", "sales", "viewer"] : ["finance", "sales", "viewer"];

  return (
    <div>
      <PageHeader
        kicker="Workspace"
        title="Equipe"
        description="Quem carrega o número, o que cada pessoa pode fazer e o histórico de tudo que mudou."
        actions={
          <ExportMenu
            title="equipe-orbio"
            headers={["Nome", "Papel", "E-mail"]}
            rows={active.map((u) => [u.name, ROLE_LABEL[(roleOf.get(u.id)?.role ?? u.role) as Role] ?? u.role, u.email])}
          />
        }
      />

      {admin ? (
        <Card className="mb-4">
          <h2 className="text-[18px] font-medium text-midnight-ink">Convidar um membro</h2>
          <p className="mt-1 text-[13px] text-ash-helper">
            Não existe cadastro público — a pessoa ativa o acesso com o mesmo e-mail e entra com o papel escolhido.
          </p>
          <form className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_auto]" onSubmit={onInvite}>
            <Field label="E-mail">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nome@empresa.com"
              />
            </Field>
            <Field label="Papel">
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className={select}>
                {inviteRoles.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r as Role]}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end">
              <Button type="submit" variant="accent" disabled={sending}>
                {sending ? "Gerando…" : "Gerar convite"}
              </Button>
            </div>
          </form>
          <p className="mt-2 text-[12px] text-ash-helper">{ROLE_HINT[inviteRole as Exclude<Role, "member">]}</p>
          {link ? <p className="mt-3 break-all text-[12px] text-slate-caption">{link}</p> : null}
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {active.map((member) => {
          const owned = deals.filter((d) => d.ownerId === member.id);
          const open = owned.filter((d) => d.stage !== "won" && d.stage !== "lost");
          const value = open.reduce((s, d) => s + d.value, 0);
          const tasks = activities.filter((a) => a.ownerId === member.id && !a.done).length;
          const memberRole = (roleOf.get(member.id)?.role ?? member.role) as Role;
          const editable = admin && memberRole !== "owner" && (role === "owner" || memberRole !== "admin");
          return (
            <Card key={member.id}>
              <div className="flex items-center gap-3">
                <Avatar initials={member.initials} hue={member.avatarHue} size="lg" />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[16px] font-medium text-midnight-ink">{member.name}</h2>
                  <Badge tone={memberRole === "owner" ? "lime" : memberRole === "viewer" ? "neutral" : "blue"}>
                    {ROLE_LABEL[memberRole] ?? memberRole}
                  </Badge>
                </div>
              </div>
              <p className="app-display mt-4 text-[26px] text-midnight-ink">{brl.format(value)}</p>
              <p className="mt-1 text-[13px] text-slate-caption">
                {open.length} deals abertos · {tasks} atividades
              </p>
              <p className="mt-3 truncate text-[12px] text-ash-helper">{member.email}</p>
              {editable ? (
                <div className="mt-4 flex items-center gap-2">
                  <select
                    aria-label={`Papel de ${member.name}`}
                    value={memberRole === "member" ? "sales" : memberRole}
                    onChange={(e) => void changeRole(member.id, e.target.value)}
                    className={cn(select, "flex-1")}
                  >
                    {(role === "owner" ? ["admin", "finance", "sales", "viewer"] : ["finance", "sales", "viewer"]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r as Role]}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setLeaving(member);
                      setHeir("");
                    }}
                    title="Desligar da empresa"
                  >
                    <UserMinus className="h-3.5 w-3.5" /> Desligar
                  </Button>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      {former.length ? (
        <p className="mt-4 text-[12px] text-ash-helper">
          Ex-membros (sem acesso, com histórico preservado): {former.map((u) => u.name).join(", ")}.
        </p>
      ) : null}

      {admin ? (
        <Card className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4 text-ash-helper" />
            <h2 className="text-[18px] font-medium text-midnight-ink">Histórico e lixeira</h2>
          </div>
          <p className="mb-4 text-[13px] text-ash-helper">
            Tudo que foi criado, alterado ou excluído. Registros excluídos podem ser restaurados.
          </p>
          {audit.length ? (
            <ul className="divide-y divide-midnight-ink/8">
              {audit.map((entry) => {
                const { type, name } = describe(entry);
                return (
                  <li key={entry.id} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                    <div className="min-w-0">
                      <p className="truncate text-midnight-ink">
                        <span className="font-medium">{(entry.actor && nameOf.get(entry.actor)) || "Sistema"}</span>{" "}
                        {ACTION_LABEL[entry.action]} {type.toLowerCase()}
                        {name ? <span className="text-slate-caption"> · {name}</span> : null}
                      </p>
                      <p className="text-[11px] text-ash-helper">{new Date(entry.at).toLocaleString("pt-BR")}</p>
                    </div>
                    {entry.action === "delete" && RESTORABLE.has(entry.tableName) ? (
                      <Button size="sm" variant="outline" onClick={() => void restore(entry)}>
                        <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-6 text-center text-[13px] text-ash-helper">Nada registrado ainda.</p>
          )}
        </Card>
      ) : null}

      <Modal open={Boolean(leaving)} onClose={() => setLeaving(null)} title={`Desligar ${leaving?.name ?? ""}`}>
        <p className="text-[13px] text-slate-caption">
          O acesso é encerrado agora, mas o histórico (conversas, registros, nome) fica na empresa. Empresas, contatos,
          oportunidades e documentos desta pessoa passam para quem você escolher.
        </p>
        <label className="mt-4 block">
          <span className="app-eyebrow mb-1.5 block !text-[10px]">Quem recebe a carteira</span>
          <select value={heir} onChange={(e) => setHeir(e.target.value)} className={select}>
            <option value="">Escolha uma pessoa…</option>
            {active
              .filter((u) => u.id !== leaving?.id)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="soft" onClick={() => setLeaving(null)}>
            Cancelar
          </Button>
          <Button variant="dark" disabled={!heir} onClick={() => void confirmOffboard()}>
            Desligar e transferir
          </Button>
        </div>
      </Modal>
    </div>
  );
}
