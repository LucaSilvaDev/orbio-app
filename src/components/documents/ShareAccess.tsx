import { Lock, UserPlus, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { listUsers } from "@/lib/directory";
import type { DocumentShareMode } from "@/types";

const modes: {
  id: DocumentShareMode;
  title: string;
  hint: string;
  icon: typeof Lock;
}[] = [
  { id: "private", title: "Só você", hint: "Ninguém da equipe vê este arquivo", icon: Lock },
  { id: "people", title: "Pessoas", hint: "Escolha os funcionários com acesso", icon: UserPlus },
  { id: "team", title: "Toda a equipe", hint: "Todos os funcionários do workspace", icon: Users },
];

export function ShareAccess({
  ownerId,
  mode,
  sharedWith,
  onMode,
  onSharedWith,
}: {
  ownerId: string;
  mode: DocumentShareMode;
  sharedWith: string[];
  onMode: (mode: DocumentShareMode) => void;
  onSharedWith: (ids: string[]) => void;
}) {
  const others = listUsers().filter((member) => member.id !== ownerId);

  function toggle(id: string) {
    onSharedWith(
      sharedWith.includes(id) ? sharedWith.filter((item) => item !== id) : [...sharedWith, id],
    );
  }

  return (
    <div className="space-y-3">
      <p className="mono text-[11px] text-ash-helper">Quem pode ver</p>
      <div className="space-y-1.5">
        {modes.map((item) => {
          const Icon = item.icon;
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onMode(item.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-card px-3 py-2.5 text-left transition-colors",
                active ? "bg-lavender-wash" : "bg-fog-surface hover:bg-lavender-wash/60",
              )}
            >
              <Icon className={cn("mt-0.5 h-4 w-4", active ? "text-royal-signal" : "text-ash-helper")} />
              <span>
                <span className="block text-[13px] font-medium text-midnight-ink">{item.title}</span>
                <span className="block text-[12px] text-ash-helper">{item.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
      {mode === "people" ? (
        others.length === 0 ? (
          <p className="text-[12px] text-ash-helper">
            Não há outros funcionários neste workspace. Cadastre alguém em Membros.
          </p>
        ) : (
          <div className="orbio-scroll max-h-48 space-y-1 overflow-auto">
            {others.map((member) => {
              const checked = sharedWith.includes(member.id);
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggle(member.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-card px-3 py-2 text-left",
                    checked ? "bg-lavender-wash" : "bg-fog-surface",
                  )}
                >
                  <Avatar initials={member.initials} hue={member.avatarHue} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-midnight-ink">{member.name}</span>
                    <span className="block truncate text-[11px] text-ash-helper">{member.email}</span>
                  </span>
                  <span
                    className={cn(
                      "h-4 w-4 rounded-[4px] border",
                      checked ? "border-royal-signal bg-royal-signal" : "border-stone-divider bg-white",
                    )}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        )
      ) : null}
    </div>
  );
}
