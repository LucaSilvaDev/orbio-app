import { useEffect, useState, type FormEvent } from "react";
import {
  File,
  FileSpreadsheet,
  FileText,
  FileType,
  Image as ImageIcon,
  Presentation,
  ScrollText,
  Share2,
} from "lucide-react";
import { PageHeader, SearchField } from "@/components/layout/PageHeader";
import { ShareAccess } from "@/components/documents/ShareAccess";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { FileDrop } from "@/components/ui/FileDrop";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Reveal } from "@/components/motion/Reveal";
import { useCrm } from "@/store/useCrm";
import { useAuth } from "@/store/useAuth";
import { useUi } from "@/store/useUi";
import { findUser } from "@/lib/records";
import { listUsers } from "@/lib/directory";
import { cn, uid } from "@/lib/cn";
import { DOC_ACCEPT, MAX_DOC_FILE, downloadBlob, formatBytes, inferDocumentKind } from "@/lib/files";
import { deleteDocFile, loadDocFile, saveDocFile } from "@/lib/docStore";
import { canManageDocument, canSeeDocument, isSharedWithMe, shareBadge } from "@/lib/docShare";
import type { DocumentFile, DocumentKind, DocumentShareMode } from "@/types";

const icons: Record<DocumentKind, typeof FileText> = {
  pdf: FileText,
  sheet: FileSpreadsheet,
  slide: Presentation,
  contract: ScrollText,
  word: FileType,
  image: ImageIcon,
  file: File,
};

const kindLabel: Record<DocumentKind, string> = {
  pdf: "PDF",
  sheet: "Planilha",
  slide: "Apresentação",
  contract: "Contrato",
  word: "Word",
  image: "Imagem",
  file: "Arquivo",
};

type Scope = "visible" | "mine" | "shared";

function notifyShare(name: string, actor: string, added: string[]) {
  const addNotification = useCrm.getState().addNotification;
  added.forEach((userId) => {
    addNotification({
      userId,
      title: "Arquivo compartilhado",
      body: `${actor} liberou “${name}” para você.`,
      time: "agora",
      read: false,
    });
  });
}

function nextSharedWith(mode: DocumentShareMode, ids: string[], ownerId: string) {
  return mode === "people" ? ids.filter((id) => id && id !== ownerId) : [];
}

export function DocumentsPage() {
  const documents = useCrm((s) => s.documents) ?? [];
  const addDocument = useCrm((s) => s.addDocument);
  const updateDocument = useCrm((s) => s.updateDocument);
  const removeDocument = useCrm((s) => s.removeDocument);
  const user = useAuth((s) => s.user);
  const pushToast = useUi((s) => s.pushToast);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("visible");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [related, setRelated] = useState("");
  const [kind, setKind] = useState<DocumentKind>("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [shareMode, setShareMode] = useState<DocumentShareMode>("private");
  const [sharedWith, setSharedWith] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [viewer, setViewer] = useState<DocumentFile | null>(null);
  const [sharing, setSharing] = useState<DocumentFile | null>(null);
  const [editMode, setEditMode] = useState<DocumentShareMode>("private");
  const [editShared, setEditShared] = useState<string[]>([]);
  const meId = user?.id ?? "";

  const visible = documents.filter((doc) => canSeeDocument(doc, meId));
  const scoped = visible.filter((doc) => {
    if (scope === "mine") return doc.ownerId === meId;
    if (scope === "shared") return isSharedWithMe(doc, meId);
    return true;
  });
  const rows = scoped.filter((doc) =>
    `${doc.name} ${doc.fileName ?? ""} ${doc.related}`.toLowerCase().includes(query.toLowerCase()),
  );

  function onPick(next: File) {
    if (next.size > MAX_DOC_FILE) {
      pushToast("Arquivo maior que 20 MB");
      return;
    }
    setFile(next);
    setName((current) => current || next.name);
    setKind(inferDocumentKind(next.name, next.type));
  }

  function resetForm() {
    setOpen(false);
    setName("");
    setRelated("");
    setKind("pdf");
    setFile(null);
    setShareMode("private");
    setSharedWith([]);
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      pushToast("Escolha ou solte um arquivo");
      return;
    }
    const ownerId = user?.id ?? "u1";
    const recipients = nextSharedWith(shareMode, sharedWith, ownerId);
    setSaving(true);
    try {
      const id = uid("doc");
      await saveDocFile(id, file);
      addDocument({
        id,
        name: name.trim() || file.name,
        kind,
        related: related.trim() || "Workspace",
        updatedAt: new Date().toISOString().slice(0, 10),
        ownerId,
        size: formatBytes(file.size),
        mime: file.type || "application/octet-stream",
        fileName: file.name,
        hasFile: true,
        shareMode,
        sharedWith: recipients,
      });
      notifyShare(name.trim() || file.name, user?.name ?? "Alguém", recipients);
      pushToast("Arquivo salvo");
      resetForm();
    } catch {
      pushToast("Não deu para gravar o arquivo");
    } finally {
      setSaving(false);
    }
  }

  async function downloadDoc(doc: DocumentFile) {
    const stored = await loadDocFile(doc.id);
    if (!stored) {
      pushToast("Este item de demo não tem arquivo anexado");
      return;
    }
    downloadBlob(doc.fileName || doc.name, stored.blob);
  }

  async function remove(id: string) {
    await deleteDocFile(id);
    removeDocument(id);
    if (viewer?.id === id) setViewer(null);
    if (sharing?.id === id) setSharing(null);
    pushToast("Arquivo removido");
  }

  function openShare(doc: DocumentFile) {
    setSharing(doc);
    setEditMode(doc.shareMode ?? "private");
    setEditShared(doc.sharedWith ?? []);
  }

  function saveShare() {
    if (!sharing) return;
    const recipients = nextSharedWith(editMode, editShared, sharing.ownerId);
    const previous = new Set(sharing.sharedWith ?? []);
    const added = editMode === "people" ? recipients.filter((id) => !previous.has(id)) : [];
    updateDocument(sharing.id, {
      shareMode: editMode,
      sharedWith: recipients,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
    notifyShare(sharing.name, user?.name ?? "Alguém", added);
    pushToast("Acesso atualizado");
    setSharing(null);
  }

  return (
    <div>
      <PageHeader
        kicker="Operação"
        title="Arquivos"
        description="Anexe o arquivo real e escolha quem da equipe pode ver. PDF e imagem abrem aqui; Word, Excel e contrato baixam para o app original."
        actions={
          <>
            <SearchField value={query} onChange={setQuery} placeholder="Buscar arquivo" />
            <ExportMenu
              title="arquivos-orbio"
              headers={["Nome", "Tipo", "Relacionado", "Acesso", "Tamanho", "Atualizado"]}
              rows={rows.map((doc) => [
                doc.name,
                kindLabel[doc.kind],
                doc.related,
                shareBadge(doc).label,
                doc.size,
                doc.updatedAt,
              ])}
            />
            <Button variant="dark" onClick={() => setOpen(true)}>
              Novo arquivo
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(
          [
            ["visible", "Visíveis"],
            ["mine", "Meus"],
            ["shared", "Compartilhados comigo"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setScope(id)}
            className={cn(
              "rounded-pill px-3 py-1.5 text-[12px] transition-colors",
              scope === id ? "bg-midnight-ink text-snow-canvas" : "bg-fog-surface text-graphite-body",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <Card>
          <p className="text-[14px] font-medium">Nenhum arquivo neste recorte</p>
          <p className="mt-1 text-[13px] text-ash-helper">
            Arquivos privados de outros funcionários não aparecem aqui. Crie um ou peça para
            compartilharem com você.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((doc, i) => {
            const Icon = icons[doc.kind] ?? File;
            const badge = shareBadge(doc);
            const owner = findUser(doc.ownerId);
            const manage = canManageDocument(doc, meId);
            const guests = listUsers().filter((member) => (doc.sharedWith ?? []).includes(member.id));
            return (
              <Reveal key={doc.id} delay={i * 0.04}>
                <Card className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-lavender-wash text-royal-signal">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="min-w-0 truncate font-medium">{doc.name}</p>
                      <Badge tone={badge.tone} className="shrink-0">
                        {badge.label}
                      </Badge>
                    </div>
                    <p className="text-[12px] text-ash-helper">
                      {kindLabel[doc.kind]} · {doc.related} · {doc.size}
                      {doc.hasFile ? "" : " · demo"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-caption">
                      {owner?.name ?? "Dono"}
                      {doc.shareMode === "people" && guests.length > 0 ? ` · ${guests.length} com acesso` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {doc.shareMode === "people" && guests.length > 0 ? (
                      <div className="flex -space-x-1.5">
                        {guests.slice(0, 3).map((member) => (
                          <Avatar
                            key={member.id}
                            initials={member.initials}
                            hue={member.avatarHue}
                            size="sm"
                            className="ring-2 ring-snow-canvas"
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12px] text-ash-helper">{doc.updatedAt}</p>
                    )}
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => setViewer(doc)}>
                        Ver
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadDoc(doc)}>
                        Baixar
                      </Button>
                      {manage ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => openShare(doc)}>
                            <Share2 className="h-3.5 w-3.5" />
                            Compartilhar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(doc.id)}>
                            Apagar
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>
      )}

      <Modal open={open} title="Novo arquivo" onClose={resetForm}>
        <form className="space-y-3" onSubmit={onCreate}>
          <FileDrop file={file} accept={DOC_ACCEPT} onFile={onPick} />
          <Field label="Nome">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Contrato Aurora.pdf"
              required
            />
          </Field>
          <Field label="Relacionado a">
            <Input
              value={related}
              onChange={(event) => setRelated(event.target.value)}
              placeholder="Empresa, deal ou pasta"
            />
          </Field>
          <Field label="Tipo">
            <select
              className="h-10 w-full rounded-pill bg-fog-surface px-4 text-[13px]"
              value={kind}
              onChange={(event) => setKind(event.target.value as DocumentKind)}
            >
              {(Object.keys(kindLabel) as DocumentKind[]).map((id) => (
                <option key={id} value={id}>
                  {kindLabel[id]}
                </option>
              ))}
            </select>
          </Field>
          <ShareAccess
            ownerId={meId}
            mode={shareMode}
            sharedWith={sharedWith}
            onMode={setShareMode}
            onSharedWith={setSharedWith}
          />
          <Button type="submit" variant="dark" className="w-full" disabled={saving || !file}>
            {saving ? "Salvando…" : "Salvar arquivo"}
          </Button>
        </form>
      </Modal>

      <Modal
        open={Boolean(sharing)}
        title={sharing ? `Compartilhar ${sharing.name}` : "Compartilhar"}
        onClose={() => setSharing(null)}
      >
        {sharing ? (
          <div className="space-y-4">
            <p className="text-[13px] text-ash-helper">
              Só o dono altera o acesso. Quem receber vê o arquivo em Arquivos, no mesmo workspace.
            </p>
            <ShareAccess
              ownerId={sharing.ownerId}
              mode={editMode}
              sharedWith={editShared}
              onMode={setEditMode}
              onSharedWith={setEditShared}
            />
            <Button variant="dark" className="w-full" onClick={saveShare}>
              Salvar acesso
            </Button>
          </div>
        ) : null}
      </Modal>

      <Modal
        wide
        open={Boolean(viewer)}
        title={viewer?.name ?? "Documento"}
        onClose={() => setViewer(null)}
      >
        {viewer ? <DocumentPreview doc={viewer} onDownload={() => downloadDoc(viewer)} /> : null}
      </Modal>
    </div>
  );
}

function DocumentPreview({
  doc,
  onDownload,
}: {
  doc: DocumentFile;
  onDownload: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const badge = shareBadge(doc);

  useEffect(() => {
    let objectUrl = "";
    let alive = true;
    loadDocFile(doc.id).then((stored) => {
      if (!alive) return;
      if (!stored) {
        setMissing(true);
        return;
      }
      objectUrl = URL.createObjectURL(stored.blob);
      setUrl(objectUrl);
    });
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [doc.id]);

  if (missing || !doc.hasFile) {
    return (
      <div className="space-y-3">
        <p className="text-[13px] text-ash-helper">
          {doc.hasFile
            ? "O arquivo não está neste navegador."
            : "Registro de demonstração — não há arquivo anexado. Crie um novo e solte o PDF, Word ou Excel real."}
        </p>
        <p className="text-[12px] text-ash-helper">
          {kindLabel[doc.kind]} · {doc.size} · {findUser(doc.ownerId)?.name} · {badge.label}
        </p>
      </div>
    );
  }

  if (!url) {
    return <p className="text-[13px] text-ash-helper">Abrindo arquivo…</p>;
  }

  const mime = doc.mime ?? "";
  const canPdf = mime.includes("pdf") || doc.kind === "pdf" || doc.name.toLowerCase().endsWith(".pdf");
  const canImage = mime.startsWith("image/") || doc.kind === "image";

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-ash-helper">
        {doc.fileName ?? doc.name} · {kindLabel[doc.kind]} · {doc.size} · {badge.label}
      </p>
      {canPdf ? (
        <iframe title={doc.name} src={url} className="h-[70vh] w-full rounded-[18px] bg-fog-surface" />
      ) : canImage ? (
        <img src={url} alt={doc.name} className="max-h-[70vh] w-full rounded-[18px] object-contain" />
      ) : (
        <div className="rounded-[18px] bg-fog-surface p-5">
          <p className="text-[14px] font-medium">Sem preview nativo neste formato</p>
          <p className="mt-1 text-[13px] text-ash-helper">
            Word, Excel, PowerPoint e contratos .docx abrem no aplicativo original. Baixe para ver o conteúdo.
          </p>
          <Button className="mt-4" variant="dark" onClick={onDownload}>
            Baixar {doc.fileName ?? doc.name}
          </Button>
        </div>
      )}
    </div>
  );
}
