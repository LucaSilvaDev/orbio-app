import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/store/useAuth";
import { STAGES, toneDot } from "@/lib/stages";
import { ACCENTS, FONTS, INKS, useUi } from "@/store/useUi";
import { LogoPicker } from "@/components/brand/LogoPicker";
import { envLabel, getWorkspace, wipeOfficialWorkspace } from "@/lib/workspace";

export function SettingsPage() {
  const user = useAuth((s) => s.user);
  const pushToast = useUi((s) => s.pushToast);
  const theme = useUi((s) => s.theme);
  const setTheme = useUi((s) => s.setTheme);
  const accent = useUi((s) => s.accent);
  const setAccent = useUi((s) => s.setAccent);
  const fontFamily = useUi((s) => s.fontFamily);
  const setFontFamily = useUi((s) => s.setFontFamily);
  const inkColor = useUi((s) => s.inkColor);
  const setInkColor = useUi((s) => s.setInkColor);

  return (
    <div>
      <PageHeader
        kicker="Workspace"
        title="Ajustes"
        description="Tema claro, acento Twenty e a tipografia do produto."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-[18px] font-semibold">Aparência</h2>
          <div className="mb-4 flex gap-2">
            {(["light", "dark"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTheme(mode)}
                className={`h-10 rounded-pill px-4 text-[13px] font-medium ${
                  theme === mode ? "bg-royal-signal text-white" : "bg-fog-surface"
                }`}
              >
                {mode === "dark" ? "Escuro" : "Claro"}
              </button>
            ))}
          </div>
          <p className="mb-2 text-[12px] text-ash-helper">Cor de acento</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {ACCENTS.map((item) => (
              <button
                key={item.id}
                onClick={() => setAccent(item.value)}
                className="h-8 w-8 rounded-full border border-stone-divider"
                style={{
                  background: item.value,
                  outline: accent === item.value ? `2px solid ${item.value}` : undefined,
                  outlineOffset: 3,
                }}
                title={item.label}
              />
            ))}
            <input
              type="color"
              value={accent}
              onChange={(event) => setAccent(event.target.value)}
              className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent"
              title="Cor livre"
            />
          </div>
          <Field label="Fonte">
            <select
              value={fontFamily}
              onChange={(event) => setFontFamily(event.target.value)}
              className="h-11 w-full rounded-input border border-stone-divider bg-fog-surface px-3 text-[14px]"
            >
              {FONTS.map((font) => (
                <option key={font.id} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="mt-3">
            <Field label="Cor da fonte">
              <select
                value={inkColor}
                onChange={(event) => setInkColor(event.target.value)}
                className="h-11 w-full rounded-input border border-stone-divider bg-fog-surface px-3 text-[14px]"
              >
                {INKS.map((ink) => (
                  <option key={ink.id} value={ink.value}>
                    {ink.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-5">
            <LogoPicker title="Símbolo da marca" />
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 text-[18px] font-semibold">Perfil</h2>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              pushToast("Perfil salvo neste workspace");
            }}
          >
            <Field label="Nome">
              <Input defaultValue={user?.name} />
            </Field>
            <Field label="E-mail">
              <Input defaultValue={user?.email} />
            </Field>
            <Field label="Cargo">
              <Input defaultValue={user?.role} />
            </Field>
            <Button type="submit" variant="accent">
              Salvar perfil
            </Button>
          </form>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 text-[18px] font-semibold">Estágios do pipeline</h2>
          <div className="space-y-2">
            {STAGES.map((stage) => (
              <div key={stage.id} className="flex items-center gap-2 rounded-card bg-fog-surface px-3 py-2 text-[14px]">
                <span className={`h-1.5 w-1.5 rounded-full ${toneDot[stage.tone]}`} />
                {stage.label}
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="mb-2 text-[18px] font-semibold">Workspace</h2>
          <p className="text-[14px] text-slate-caption">
            Agora: <strong>{envLabel()}</strong>.
            QA carrega o time seedado. Produção começa vazia e guarda conta/senha só neste navegador.
          </p>
          {getWorkspace() === "official" ? (
            <Button
              className="mt-4"
              variant="ghost"
              onClick={() => {
                wipeOfficialWorkspace();
                pushToast("Produção zerada");
                window.location.assign("/login");
              }}
            >
              Zerar produção
            </Button>
          ) : null}
        </Card>
        <Card className="p-6">
          <h2 className="mb-2 text-[18px] font-semibold">Integrações</h2>
          <p className="text-[14px] text-slate-caption">
            Supabase está preparado em src/services/supabase.ts. Tema, dock e views já vivem neste workspace.
          </p>
        </Card>
      </div>
    </div>
  );
}
