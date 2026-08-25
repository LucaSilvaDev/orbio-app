import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileSpreadsheet,
  FileText,
  Hash,
  ImageIcon,
  Paperclip,
  Plus,
  Send,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useCrm } from "@/store/useCrm";
import { useAuth } from "@/store/useAuth";
import { useUi } from "@/store/useUi";
import { findUser } from "@/lib/records";
import { listUsers } from "@/lib/directory";
import { downloadDataUrl, filesToAttachments, formatBytes } from "@/lib/files";
import { uid } from "@/lib/cn";
import type { ChatAttachment, ChatThread } from "@/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

function threadTitle(thread: ChatThread, me: string) {
  if (thread.kind === "channel") return thread.name ?? "Canal";
  const other = thread.memberIds.find((id) => id !== me) ?? thread.memberIds[0];
  return findUser(other)?.name ?? "Conversa";
}

function AttachmentCard({ file }: { file: ChatAttachment }) {
  const Icon = file.kind === "sheet" ? FileSpreadsheet : file.kind === "image" ? ImageIcon : FileText;
  return (
    <div className="overflow-hidden rounded-[20px] bg-white/70 shadow-card">
      {file.kind === "image" && file.dataUrl ? (
        <button className="block w-full" onClick={() => window.open(file.dataUrl, "_blank")}>
          <img src={file.dataUrl} alt={file.name} className="max-h-56 w-full object-cover" />
        </button>
      ) : null}
      <button
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
        onClick={() => downloadDataUrl(file.name, file.dataUrl)}
      >
        <Icon className="h-4 w-4 text-royal-signal" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px]">{file.name}</span>
          <span className="mono text-[10px] text-ash-helper">{formatBytes(file.size)} · baixar</span>
        </span>
      </button>
    </div>
  );
}

export function InboxPage() {
  const { threads, messages, sendMessage, markThreadRead, openDm, createChannel } = useCrm();
  const me = useAuth((s) => s.user);
  const pushToast = useUi((s) => s.pushToast);
  const meId = me?.id ?? "u1";
  const users = listUsers();
  const mine = threads
    .filter((thread) => thread.memberIds.includes(meId))
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const [activeId, setActiveId] = useState(mine[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState<ChatAttachment[]>([]);
  const [channelOpen, setChannelOpen] = useState(false);
  const [channelName, setChannelName] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const active = mine.find((thread) => thread.id === activeId) ?? mine[0];
  const threadMessages = useMemo(
    () => messages.filter((item) => item.threadId === active?.id),
    [messages, active?.id],
  );

  useEffect(() => {
    if (active) markThreadRead(active.id, meId);
  }, [active?.id, meId, markThreadRead]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [threadMessages.length, pending.length]);

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    try {
      const next = await filesToAttachments(list);
      setPending((current) => [...current, ...next.map((file) => ({ ...file, id: uid("att") }))]);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Arquivo grande demais");
    }
  }

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!active || (!body.trim() && pending.length === 0)) return;
    sendMessage(active.id, meId, body.trim(), pending);
    setBody("");
    setPending([]);
    pushToast("Mensagem enviada ao time");
  }

  const channels = mine.filter((thread) => thread.kind === "channel");
  const dms = mine.filter((thread) => thread.kind === "dm");
  const others = users.filter((user) => user.id !== meId);

  return (
    <div>
      <PageHeader
        kicker="Time"
        title="Inbox interno"
        description="O WhatsApp da empresa: canais, conversas, fotos, PDFs e planilhas no mesmo lugar."
        actions={
          <Button variant="dark" onClick={() => setChannelOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Novo canal
          </Button>
        }
      />

      <div className="grid min-h-[74vh] overflow-hidden rounded-[32px] bg-snow-canvas/70 shadow-lift backdrop-blur-xl lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col bg-fog-surface/40 p-3">
          <p className="mono px-2 pt-1 text-[10px] text-ash-helper">Canais</p>
          <div className="mt-1 space-y-1">
            {channels.map((thread) => {
              const unread = thread.unreadBy.includes(meId);
              return (
                <button
                  key={thread.id}
                  onClick={() => setActiveId(thread.id)}
                  className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left transition ${
                    active?.id === thread.id ? "bg-snow-canvas shadow-card" : "hover:bg-snow-canvas/70"
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lavender-wash text-royal-signal">
                    <Hash className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px]">{thread.name}</span>
                  {unread ? <span className="h-2 w-2 rounded-full bg-royal-signal" /> : null}
                </button>
              );
            })}
          </div>
          <p className="mono mt-4 px-2 text-[10px] text-ash-helper">Pessoas</p>
          <div className="mt-1 space-y-1">
            {others.map((person) => {
              const thread = dms.find(
                (item) => item.memberIds.includes(person.id) && item.memberIds.includes(meId),
              );
              const unread = thread?.unreadBy.includes(meId);
              return (
                <button
                  key={person.id}
                  onClick={() => setActiveId(openDm(meId, person.id))}
                  className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left transition ${
                    active?.id === thread?.id ? "bg-snow-canvas shadow-card" : "hover:bg-snow-canvas/70"
                  }`}
                >
                  <Avatar initials={person.initials} hue={person.avatarHue} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]">{person.name.split(" ")[0]}</span>
                    <span className="block truncate text-[11px] text-ash-helper">{person.role}</span>
                  </span>
                  {unread ? <span className="h-2 w-2 rounded-full bg-royal-signal" /> : null}
                </button>
              );
            })}
          </div>
        </aside>

        {active ? (
          <section className="flex min-h-[70vh] flex-col">
            <header className="flex items-center gap-3 px-5 py-4">
              <Avatar
                initials={threadTitle(active, meId).slice(0, 2).toUpperCase()}
                hue={active.kind === "channel" ? 262 : findUser(active.memberIds.find((id) => id !== meId) ?? "")?.avatarHue}
              />
              <div>
                <p className="text-[16px]">{threadTitle(active, meId)}</p>
                <p className="text-[12px] text-ash-helper">
                  {active.kind === "channel"
                    ? `${active.memberIds.length} pessoas neste canal`
                    : findUser(active.memberIds.find((id) => id !== meId) ?? "")?.email}
                </p>
              </div>
            </header>

            <div ref={scroller} className="orbio-scroll flex-1 space-y-3 overflow-y-auto px-5 py-2">
              <AnimatePresence initial={false}>
                {threadMessages.map((item) => {
                  const author = findUser(item.authorId);
                  const mineMsg = item.authorId === meId;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      className={`flex gap-2 ${mineMsg ? "justify-end" : "justify-start"}`}
                    >
                      {mineMsg ? null : (
                        <Avatar initials={author?.initials ?? "?"} hue={author?.avatarHue} size="sm" />
                      )}
                      <div className={`max-w-[min(100%,420px)] ${mineMsg ? "items-end" : ""}`}>
                        <p className="mb-1 px-1 text-[11px] text-ash-helper">
                          {mineMsg ? "Você" : author?.name} ·{" "}
                          {format(parseISO(item.createdAt), "HH:mm", { locale: ptBR })}
                        </p>
                        {item.body ? (
                          <div
                            className={`rounded-[22px] px-4 py-2.5 text-[14px] leading-6 ${
                              mineMsg
                                ? "bg-midnight-ink text-snow-canvas"
                                : "bg-lavender-wash text-graphite-body"
                            }`}
                          >
                            {item.body}
                          </div>
                        ) : null}
                        {item.attachments.length ? (
                          <div className="mt-2 space-y-2">
                            {item.attachments.map((file) => (
                              <AttachmentCard key={file.id} file={file} />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <form className="p-4" onSubmit={submit}>
              {pending.length ? (
                <div className="mb-2 flex flex-wrap gap-2">
                  {pending.map((file) => (
                    <span key={file.id} className="rounded-full bg-lavender-wash px-3 py-1 text-[11px]">
                      {file.name}
                      <button
                        type="button"
                        className="ml-2 text-ash-helper"
                        onClick={() => setPending((list) => list.filter((item) => item.id !== file.id))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="flex items-end gap-2 rounded-[28px] bg-fog-surface px-3 py-2 shadow-card">
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  multiple
                  accept="image/*,.csv,.xls,.xlsx,.pdf,.ppt,.pptx,.doc,.docx"
                  onChange={(event) => {
                    onFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-snow-canvas"
                  aria-label="Anexar arquivo"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      submit();
                    }
                  }}
                  placeholder="Escreva, anexe uma foto ou uma planilha…"
                  rows={1}
                  className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2 text-[14px] outline-none"
                />
                <button
                  type="submit"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-midnight-ink text-snow-canvas"
                  aria-label="Enviar"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </section>
        ) : null}
      </div>

      <Modal open={channelOpen} title="Novo canal" onClose={() => setChannelOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const id = createChannel(channelName, users.map((user) => user.id));
            setActiveId(id);
            setChannelOpen(false);
            setChannelName("");
            pushToast("Canal criado");
          }}
        >
          <Field label="Nome do canal">
            <Input value={channelName} onChange={(e) => setChannelName(e.target.value)} required />
          </Field>
          <Button type="submit" variant="dark" className="w-full">
            Criar
          </Button>
        </form>
      </Modal>
    </div>
  );
}
