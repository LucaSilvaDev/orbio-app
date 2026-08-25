import { useEffect, useMemo, useState } from "react";
import { Copy, Download, Eye, EyeOff, File as FileIcon, Lock as LockIcon, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PinPad } from "@/components/vault/PinPad";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { FileDrop } from "@/components/ui/FileDrop";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Reveal } from "@/components/motion/Reveal";
import { Logo } from "@/components/brand/Logo";
import { requestVaultLockPermission } from "@/hooks/useVaultSession";
import { pinProblem } from "@/lib/vaultCrypto";
import { DOC_ACCEPT, MAX_VAULT_FILE, downloadBlob, formatBytes } from "@/lib/files";
import { useUi } from "@/store/useUi";
import { useVault, type VaultItem, type VaultKind } from "@/store/useVault";

const kindLabel: Record<VaultKind, string> = {
  password: "Senha",
  note: "Nota",
  other: "Segredo",
  file: "Arquivo",
};

const kindTone: Record<VaultKind, "blue" | "mint" | "amber" | "neutral"> = {
  password: "blue",
  note: "mint",
  file: "amber",
  other: "neutral",
};

const emptyDraft = {
  title: "",
  kind: "password" as VaultKind,
  username: "",
  secret: "",
  notes: "",
};

export function VaultPage() {
  const status = useVault((s) => s.status);
  const items = useVault((s) => s.items);
  const keepSession = useVault((s) => s.keepSession);
  const busy = useVault((s) => s.busy);
  const error = useVault((s) => s.error);
  const setup = useVault((s) => s.setup);
  const unlock = useVault((s) => s.unlock);
  const lock = useVault((s) => s.lock);
  const setKeepSession = useVault((s) => s.setKeepSession);
  const upsertItem = useVault((s) => s.upsertItem);
  const removeItem = useVault((s) => s.removeItem);
  const loadFile = useVault((s) => s.loadFile);
  const rotatePin = useVault((s) => s.rotatePin);
  const destroy = useVault((s) => s.destroy);
  const pushToast = useUi((s) => s.pushToast);

  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phase, setPhase] = useState<"create" | "confirm">("create");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string>();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [pinOpen, setPinOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [nextPin, setNextPin] = useState("");
  const [wipe, setWipe] = useState("");
  const [query, setQuery] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (!useVault.getState().keepSession) useVault.getState().lock();
    };
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      `${item.title} ${item.username} ${item.notes} ${item.fileName ?? ""}`.toLowerCase().includes(q),
    );
  }, [items, query]);

  async function submitPin(code: string) {
    if (status === "setup") {
      if (phase === "create") {
        const problem = pinProblem(code);
        if (problem) {
          pushToast(problem);
          return;
        }
        setPin(code);
        setPhase("confirm");
        setConfirm("");
        return;
      }
      if (await setup(pin, code)) {
        setPin("");
        setConfirm("");
        setPhase("create");
        pushToast("Cofre criado");
        void requestVaultLockPermission();
      }
      return;
    }
    if (await unlock(code)) {
      setPin("");
      pushToast("Cofre aberto");
      void requestVaultLockPermission();
    }
  }

  async function copySecret(value: string) {
    await navigator.clipboard.writeText(value);
    pushToast("Copiado · some da área de transferência em 15s");
    window.setTimeout(() => {
      void navigator.clipboard.writeText(" ").catch(() => undefined);
    }, 15_000);
  }

  function openItem(item?: VaultItem) {
    if (item) {
      setEditingId(item.id);
      setDraft({
        title: item.title,
        kind: item.kind,
        username: item.username,
        secret: item.secret,
        notes: item.notes,
      });
      setPendingFile(null);
    } else {
      setEditingId(undefined);
      setDraft(emptyDraft);
      setPendingFile(null);
    }
    setOpen(true);
  }

  function pickFile(next: File) {
    if (next.size > MAX_VAULT_FILE) {
      pushToast("Arquivo maior que 10 MB");
      return;
    }
    setPendingFile(next);
    setDraft((current) => ({
      ...current,
      kind: "file",
      title: current.title || next.name.replace(/\.[^.]+$/, ""),
    }));
  }

  async function openVaultFile(item: VaultItem, download: boolean) {
    try {
      const blob = await loadFile(item.id);
      const name = item.fileName || "arquivo";
      if (!download && (item.fileMime?.startsWith("image/") || item.fileMime === "application/pdf")) {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener");
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        return;
      }
      downloadBlob(name, blob);
    } catch {
      pushToast("Não deu para abrir o arquivo");
    }
  }

  async function saveItem() {
    const isFile = draft.kind === "file";
    if (!draft.title.trim()) {
      pushToast("Dê um título");
      return;
    }
    if (isFile && !pendingFile && !editingId) {
      pushToast("Escolha um arquivo");
      return;
    }
    if (isFile && editingId) {
      const current = items.find((item) => item.id === editingId);
      if (!pendingFile && !current?.fileName) {
        pushToast("Escolha um arquivo");
        return;
      }
    }
    if (!isFile && !draft.secret.trim()) {
      pushToast("Título e conteúdo são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      await upsertItem({ ...draft, id: editingId, file: pendingFile });
      setOpen(false);
      setPendingFile(null);
      pushToast("Salvo no cofre");
    } catch {
      pushToast("Não deu para gravar o item");
    } finally {
      setSaving(false);
    }
  }

  async function toggleKeep(on: boolean) {
    await setKeepSession(on);
    if (on) await requestVaultLockPermission();
  }

  if (status === "booting") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Logo size={36} />
      </div>
    );
  }

  if (status !== "unlocked") {
    const confirming = status === "setup" && phase === "confirm";
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center">
        <Card className="w-full p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-fog-surface">
              <LockIcon className="h-5 w-5 text-midnight-ink" />
            </div>
            <p className="mono mb-1 text-[11px] text-ash-helper">Privado neste aparelho</p>
            <h1 className="text-[24px] leading-tight text-midnight-ink">Cofre pessoal</h1>
            <p className="mt-2 text-[13px] text-slate-caption">
              {status === "setup"
                ? confirming
                  ? "Repita o PIN para confirmar. Mínimo 6 números."
                  : "Crie um PIN numérico de no mínimo 6 dígitos. Sem ele, ninguém lê o que você guardar aqui."
                : "Digite o PIN que você criou para abrir o cofre."}
            </p>
          </div>
          <PinPad
            value={confirming ? confirm : pin}
            onChange={confirming ? setConfirm : setPin}
            onSubmit={(code) => void submitPin(code)}
            disabled={busy}
            label={confirming ? "Confirme o PIN" : status === "setup" ? "Novo PIN" : "PIN do cofre"}
          />
          {confirming ? (
            <button
              type="button"
              className="mt-3 w-full text-center text-[12px] text-ash-helper"
              onClick={() => {
                setPhase("create");
                setConfirm("");
                setPin("");
              }}
            >
              Recomeçar
            </button>
          ) : null}
          {error ? <p className="mt-3 text-center text-[12px] text-[#b42318]">{error}</p> : null}
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl bg-fog-surface p-3">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={keepSession}
              onChange={(event) => void toggleKeep(event.target.checked)}
            />
            <span>
              <span className="block text-[13px] text-midnight-ink">Manter aberto nesta sessão</span>
              <span className="mt-0.5 block text-[12px] text-slate-caption">
                Não pede o PIN de novo enquanto o navegador estiver aberto e o notebook não for
                bloqueado ou reiniciado.
              </span>
            </span>
          </label>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Privado"
        title="Cofre pessoal"
        description="Senhas, notas e arquivos criptografados neste aparelho. O PIN não sai daqui."
        actions={
          <>
            <Button variant="outline" onClick={lock}>
              Bloquear
            </Button>
            <Button variant="dark" onClick={() => openItem()}>
              <Plus className="h-3.5 w-3.5" />
              Novo item
            </Button>
          </>
        }
      />

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_280px]">
        <Card>
          <p className="text-[11px] tracking-[0.08em] text-ash-helper uppercase">Itens</p>
          <p className="mt-2 font-mono text-[26px] tracking-[-0.04em] text-midnight-ink">
            {items.length}
          </p>
          <p className="mt-1 text-[12px] text-slate-caption">Criptografados com AES-GCM</p>
        </Card>
        <Card>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={keepSession}
              onChange={(event) => void toggleKeep(event.target.checked)}
            />
            <span>
              <span className="block text-[13px] text-midnight-ink">Manter aberto nesta sessão</span>
              <span className="mt-1 block text-[12px] text-slate-caption">
                Fecha sozinho se o notebook bloquear, reiniciar ou se o navegador fechar.
              </span>
            </span>
          </label>
        </Card>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar no cofre"
          className="h-10 w-full max-w-xs rounded-pill bg-fog-surface px-4 text-[13px] text-graphite-body placeholder:text-ash-helper"
        />
        <Button variant="ghost" size="sm" onClick={() => setPinOpen(true)}>
          Trocar PIN
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-[15px] text-midnight-ink">Cofre vazio</p>
          <p className="mt-1 text-[13px] text-slate-caption">
            Guarde senha, token, PDF, contrato, o que for crítico e não pode ir para Notas.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((item, index) => {
            const visible = revealed[item.id];
            return (
              <Reveal key={item.id} delay={index * 0.03}>
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[16px] font-semibold text-midnight-ink">{item.title}</p>
                      {item.username ? (
                        <p className="mt-0.5 text-[12px] text-ash-helper">{item.username}</p>
                      ) : null}
                    </div>
                    <Badge tone={kindTone[item.kind]}>{kindLabel[item.kind]}</Badge>
                  </div>
                  {item.kind === "file" ? (
                    <p className="mt-3 flex items-center gap-2 text-[13px] text-graphite-body">
                      <FileIcon className="h-4 w-4 shrink-0 text-ash-helper" />
                      <span className="min-w-0 truncate">
                        {item.fileName || "Arquivo"}
                        {item.fileSize ? ` · ${formatBytes(item.fileSize)}` : ""}
                      </span>
                    </p>
                  ) : (
                    <p className="mt-3 break-all font-mono text-[13px] text-graphite-body">
                      {visible ? item.secret || "—" : "••••••••"}
                    </p>
                  )}
                  {item.notes ? (
                    <p className="mt-2 text-[12px] text-slate-caption">{item.notes}</p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.kind === "file" ? (
                      <>
                        <Button size="sm" variant="soft" onClick={() => void openVaultFile(item, false)}>
                          <Eye className="h-3.5 w-3.5" />
                          Abrir
                        </Button>
                        <Button size="sm" variant="soft" onClick={() => void openVaultFile(item, true)}>
                          <Download className="h-3.5 w-3.5" />
                          Baixar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="soft"
                          onClick={() =>
                            setRevealed((current) => ({ ...current, [item.id]: !visible }))
                          }
                        >
                          {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          {visible ? "Ocultar" : "Revelar"}
                        </Button>
                        <Button size="sm" variant="soft" onClick={() => void copySecret(item.secret)}>
                          <Copy className="h-3.5 w-3.5" />
                          Copiar
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => openItem(item)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        void removeItem(item.id);
                        pushToast("Item apagado");
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Apagar
                    </Button>
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>
      )}

      <Card className="mt-6 p-4">
        <p className="mb-2 text-[13px] font-medium text-midnight-ink">Zona de risco</p>
        <p className="mb-3 text-[12px] text-slate-caption">
          Esqueceu o PIN? Não há recuperação. Apagar o cofre destrói os itens neste aparelho.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Digite APAGAR">
            <Input value={wipe} onChange={(event) => setWipe(event.target.value)} />
          </Field>
          <Button
            variant="outline"
            disabled={wipe !== "APAGAR"}
            onClick={() => {
              void destroy().then(() => {
                setWipe("");
                setPin("");
                setConfirm("");
                setPhase("create");
                pushToast("Cofre destruído");
              });
            }}
          >
            Destruir cofre
          </Button>
        </div>
      </Card>

      <Modal
        open={open}
        title={editingId ? "Editar item" : "Novo item"}
        onClose={() => setOpen(false)}
      >
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void saveItem();
          }}
        >
          <Field label="Título">
            <Input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="Banco, e-mail, Wi-Fi…"
              autoComplete="off"
            />
          </Field>
          <Field label="Tipo">
            <select
              value={draft.kind}
              onChange={(event) =>
                setDraft((current) => ({ ...current, kind: event.target.value as VaultKind }))
              }
              className="h-10 w-full rounded-pill bg-fog-surface px-4 text-[13px]"
            >
              <option value="password">Senha</option>
              <option value="note">Nota</option>
              <option value="file">Arquivo</option>
              <option value="other">Outro segredo</option>
            </select>
          </Field>
          {draft.kind === "file" ? (
            <Field label="Arquivo">
              <FileDrop
                file={pendingFile}
                accept={DOC_ACCEPT}
                onFile={pickFile}
                label={
                  pendingFile
                    ? pendingFile.name
                    : editingId
                      ? "Trocar arquivo ou manter o atual"
                      : "Solte o arquivo aqui ou clique para escolher"
                }
              />
              {!pendingFile && editingId ? (
                <p className="mt-2 text-[12px] text-slate-caption">
                  Atual: {items.find((item) => item.id === editingId)?.fileName ?? "arquivo no cofre"}
                </p>
              ) : (
                <p className="mt-2 text-[12px] text-slate-caption">
                  PDF, Word, Excel, imagem ou o que for crítico · até 10 MB · fica criptografado neste aparelho
                </p>
              )}
            </Field>
          ) : (
            <>
              <Field label="Usuário / login">
                <Input
                  value={draft.username}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, username: event.target.value }))
                  }
                  autoComplete="off"
                />
              </Field>
              <Field label={draft.kind === "note" ? "Conteúdo" : "Senha / segredo"}>
                <Textarea
                  value={draft.secret}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, secret: event.target.value }))
                  }
                  autoComplete="off"
                />
              </Field>
            </>
          )}
          <Field label="Observação">
            <Input
              value={draft.notes}
              onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
              autoComplete="off"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="dark" type="submit" disabled={saving} onClick={() => void saveItem()}>
              {saving ? "Criptografando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={pinOpen} title="Trocar PIN" onClose={() => setPinOpen(false)}>
        <div className="space-y-3">
          <Field label="PIN atual">
            <Input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={currentPin}
              onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, "").slice(0, 12))}
            />
          </Field>
          <Field label="Novo PIN (mín. 6 números)">
            <Input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={nextPin}
              onChange={(event) => setNextPin(event.target.value.replace(/\D/g, "").slice(0, 12))}
            />
          </Field>
          {error ? <p className="text-[12px] text-[#b42318]">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPinOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="dark"
              disabled={busy}
              onClick={() => {
                void rotatePin(currentPin, nextPin).then((ok) => {
                  if (ok) {
                    setPinOpen(false);
                    setCurrentPin("");
                    setNextPin("");
                    pushToast("PIN atualizado");
                  }
                });
              }}
            >
              Salvar PIN
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
