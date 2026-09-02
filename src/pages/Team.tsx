import { useEffect, useState, type FormEvent } from "react";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { listUsers, refreshUsers } from "@/lib/directory";
import { useCrm } from "@/store/useCrm";
import { useUi } from "@/store/useUi";
import { brl } from "@/lib/cn";
import { getWorkspace } from "@/lib/workspace";
import { createInvite, inviteUrl } from "@/services/invites";
import type { User } from "@/types";

export function TeamPage() {
  const deals = useCrm((s) => s.deals);
  const activities = useCrm((s) => s.activities);
  const pushToast = useUi((s) => s.pushToast);
  const [users, setUsers] = useState<User[]>(listUsers());
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const official = getWorkspace() === "official";

  useEffect(() => {
    void refreshUsers().then(setUsers);
  }, []);

  async function onInvite(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    const result = await createInvite(email);
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

  return (
    <div>
      <PageHeader
        kicker="Workspace"
        title="Equipe"
        description="Quem carrega o número. Cada um entra com o próprio e-mail no login."
        actions={
          <ExportMenu
            title="equipe-orbio"
            headers={["Nome", "Papel", "E-mail"]}
            rows={users.map((u) => [u.name, u.role, u.email])}
          />
        }
      />

      {official ? (
        <Card className="mb-4 p-5">
          <h2 className="text-[16px] font-semibold">Convidar um membro</h2>
          <p className="mt-1 text-[13px] text-ash-helper">
            Só o dono convida. A pessoa cria a conta com o mesmo e-mail e entra no workspace.
          </p>
          <form className="mt-4 flex flex-wrap gap-2" onSubmit={onInvite}>
            <div className="min-w-[240px] flex-1">
              <Field label="E-mail">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nome@empresa.com"
                />
              </Field>
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="accent" disabled={sending}>
                {sending ? "Gerando…" : "Gerar convite"}
              </Button>
            </div>
          </form>
          {link ? (
            <p className="mt-3 break-all text-[12px] text-slate-caption">{link}</p>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {users.map((member) => {
          const owned = deals.filter((d) => d.ownerId === member.id);
          const open = owned.filter((d) => d.stage !== "won" && d.stage !== "lost");
          const value = open.reduce((s, d) => s + d.value, 0);
          const tasks = activities.filter((a) => a.ownerId === member.id && !a.done).length;
          return (
            <Card key={member.id} className="p-5">
              <div className="flex items-center gap-3">
                <Avatar initials={member.initials} hue={member.avatarHue} size="lg" />
                <div>
                  <h2 className="font-semibold">{member.name}</h2>
                  <p className="text-[13px] text-ash-helper">{member.role}</p>
                </div>
              </div>
              <p className="mt-4 font-mono text-[20px] tracking-[-0.04em] text-royal-signal">
                {brl.format(value)}
              </p>
              <p className="mt-1 text-[13px] text-slate-caption">
                {open.length} deals abertos · {tasks} atividades
              </p>
              <p className="mt-3 text-[12px] text-ash-helper">{member.email}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
