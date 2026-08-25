import { ExportMenu } from "@/components/ui/ExportMenu";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { listUsers } from "@/lib/directory";
import { useCrm } from "@/store/useCrm";
import { brl } from "@/lib/cn";

export function TeamPage() {
  const deals = useCrm((s) => s.deals);
  const activities = useCrm((s) => s.activities);
  const users = listUsers();

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
