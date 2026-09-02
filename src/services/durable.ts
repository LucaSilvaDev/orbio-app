import type {
  ChatAttachment,
  ChatMessage,
  ChatThread,
  DocumentFile,
  DocumentKind,
  DocumentShareMode,
  Invoice,
  InvoiceStatus,
} from "@/types";
import { currentWorkspaceId, isOfficialCloud } from "@/services/core";
import { supabase } from "@/services/supabase";

let durableReady = false;

export function isDurableReady() {
  return durableReady;
}

export function markDurableReady(value: boolean) {
  durableReady = value;
}

function uuidOrNull(value: string | undefined) {
  if (!value) return null;
  return /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

function mapDocument(row: Record<string, unknown>): DocumentFile {
  const share = row.share_mode;
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    kind: (row.kind as DocumentKind) || "file",
    related: String(row.related ?? ""),
    updatedAt: String(row.updated_at ?? "").slice(0, 10),
    ownerId: String(row.owner_id ?? ""),
    size: String(row.size_label ?? ""),
    mime: String(row.mime ?? ""),
    fileName: String(row.file_name ?? ""),
    hasFile: Boolean(row.storage_path),
    shareMode:
      share === "private" || share === "people" || share === "team"
        ? (share as DocumentShareMode)
        : "private",
    sharedWith: Array.isArray(row.shared_with) ? row.shared_with.map(String) : [],
    storagePath: String(row.storage_path ?? ""),
    sha256: String(row.sha256 ?? ""),
    sizeBytes: Number(row.size_bytes ?? 0) || 0,
  };
}

function mapInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: String(row.id),
    number: String(row.number ?? ""),
    companyId: String(row.company_id ?? ""),
    dealId: String(row.deal_id ?? ""),
    amount: Number(row.amount ?? 0) || 0,
    status: (row.status as InvoiceStatus) || "draft",
    issuedAt: String(row.issued_at ?? "").slice(0, 10),
    dueAt: String(row.due_at ?? "").slice(0, 10),
    filePath: String(row.file_path ?? ""),
    fileName: String(row.file_name ?? ""),
    fileMime: String(row.file_mime ?? ""),
    fileHash: String(row.file_hash ?? ""),
    fileSize: Number(row.file_size ?? 0) || 0,
  };
}

function mapThread(row: Record<string, unknown>): ChatThread {
  return {
    id: String(row.id),
    kind: row.kind === "channel" ? "channel" : "dm",
    name: row.name ? String(row.name) : undefined,
    memberIds: Array.isArray(row.member_ids) ? row.member_ids.map(String) : [],
    unreadBy: Array.isArray(row.unread_by) ? row.unread_by.map(String) : [],
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

function mapAttachment(raw: unknown): ChatAttachment {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    mime: String(row.mime ?? ""),
    size: Number(row.size ?? 0) || 0,
    kind:
      row.kind === "image" || row.kind === "sheet" || row.kind === "pdf" || row.kind === "file"
        ? row.kind
        : "file",
    storagePath: row.storagePath ? String(row.storagePath) : undefined,
  };
}

function mapMessage(row: Record<string, unknown>): ChatMessage {
  return {
    id: String(row.id),
    threadId: String(row.thread_id),
    authorId: String(row.author_id ?? ""),
    body: String(row.body ?? ""),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    attachments: Array.isArray(row.attachments) ? row.attachments.map(mapAttachment) : [],
  };
}

export type DurablePayload = {
  documents: DocumentFile[];
  invoices: Invoice[];
  threads: ChatThread[];
  messages: ChatMessage[];
};

export async function loadDurable(): Promise<DurablePayload | null> {
  if (!isOfficialCloud() || !supabase) return null;
  const wid = currentWorkspaceId();
  if (!wid) return null;

  const [documents, invoices, threads, messages] = await Promise.all([
    supabase.from("documents").select("*").eq("workspace_id", wid),
    supabase.from("invoices").select("*").eq("workspace_id", wid),
    supabase.from("chat_threads").select("*").eq("workspace_id", wid),
    supabase.from("chat_messages").select("*").eq("workspace_id", wid),
  ]);

  if (documents.error || invoices.error || threads.error || messages.error) return null;

  return {
    documents: (documents.data ?? []).map((row) => mapDocument(row as Record<string, unknown>)),
    invoices: (invoices.data ?? []).map((row) => mapInvoice(row as Record<string, unknown>)),
    threads: (threads.data ?? []).map((row) => mapThread(row as Record<string, unknown>)),
    messages: (messages.data ?? []).map((row) => mapMessage(row as Record<string, unknown>)),
  };
}

function documentRow(item: DocumentFile) {
  return {
    id: item.id,
    workspace_id: currentWorkspaceId(),
    name: item.name,
    kind: item.kind,
    related: item.related,
    updated_at: item.updatedAt || new Date().toISOString().slice(0, 10),
    owner_id: item.ownerId,
    size_label: item.size,
    size_bytes: item.sizeBytes ?? 0,
    mime: item.mime ?? "",
    file_name: item.fileName ?? item.name,
    storage_path: item.storagePath ?? "",
    sha256: item.sha256 ?? "",
    share_mode: item.shareMode ?? "private",
    shared_with: item.sharedWith ?? [],
  };
}

function invoiceRow(item: Invoice) {
  return {
    id: item.id,
    workspace_id: currentWorkspaceId(),
    number: item.number,
    company_id: uuidOrNull(item.companyId),
    deal_id: uuidOrNull(item.dealId),
    amount: item.amount,
    status: item.status,
    issued_at: item.issuedAt || null,
    due_at: item.dueAt || null,
    file_path: item.filePath ?? "",
    file_name: item.fileName ?? "",
    file_mime: item.fileMime ?? "",
    file_hash: item.fileHash ?? "",
    file_size: item.fileSize ?? 0,
  };
}

function threadRow(item: ChatThread) {
  return {
    id: item.id,
    workspace_id: currentWorkspaceId(),
    kind: item.kind,
    name: item.name ?? null,
    member_ids: item.memberIds,
    unread_by: item.unreadBy,
    updated_at: item.updatedAt,
  };
}

function messageRow(item: ChatMessage) {
  return {
    id: item.id,
    workspace_id: currentWorkspaceId(),
    thread_id: item.threadId,
    author_id: item.authorId,
    body: item.body,
    attachments: item.attachments.map((file) => ({
      id: file.id,
      name: file.name,
      mime: file.mime,
      size: file.size,
      kind: file.kind,
      storagePath: file.storagePath ?? "",
    })),
    created_at: item.createdAt,
  };
}

export function persistDocument(item: DocumentFile, mode: "upsert" | "delete" = "upsert") {
  if (!isOfficialCloud() || !supabase || !currentWorkspaceId()) return;
  if (mode === "delete") {
    void supabase.from("documents").delete().eq("id", item.id);
    return;
  }
  void supabase.from("documents").upsert(documentRow(item));
}

export function persistDocumentPatch(id: string, data: Partial<DocumentFile>) {
  if (!isOfficialCloud() || !supabase || !currentWorkspaceId()) return;
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.kind !== undefined) patch.kind = data.kind;
  if (data.related !== undefined) patch.related = data.related;
  if (data.updatedAt !== undefined) patch.updated_at = data.updatedAt;
  if (data.size !== undefined) patch.size_label = data.size;
  if (data.sizeBytes !== undefined) patch.size_bytes = data.sizeBytes;
  if (data.mime !== undefined) patch.mime = data.mime;
  if (data.fileName !== undefined) patch.file_name = data.fileName;
  if (data.storagePath !== undefined) patch.storage_path = data.storagePath;
  if (data.sha256 !== undefined) patch.sha256 = data.sha256;
  if (data.shareMode !== undefined) patch.share_mode = data.shareMode;
  if (data.sharedWith !== undefined) patch.shared_with = data.sharedWith;
  void supabase.from("documents").update(patch).eq("id", id);
}

export function persistInvoice(item: Invoice, mode: "upsert" | "delete" = "upsert") {
  if (!isOfficialCloud() || !supabase || !currentWorkspaceId()) return;
  if (mode === "delete") {
    void supabase.from("invoices").delete().eq("id", item.id);
    return;
  }
  void supabase.from("invoices").upsert(invoiceRow(item));
}

export function persistInvoicePatch(id: string, data: Partial<Invoice>) {
  if (!isOfficialCloud() || !supabase || !currentWorkspaceId()) return;
  const patch: Record<string, unknown> = {};
  if (data.number !== undefined) patch.number = data.number;
  if (data.companyId !== undefined) patch.company_id = uuidOrNull(data.companyId);
  if (data.dealId !== undefined) patch.deal_id = uuidOrNull(data.dealId);
  if (data.amount !== undefined) patch.amount = data.amount;
  if (data.status !== undefined) patch.status = data.status;
  if (data.issuedAt !== undefined) patch.issued_at = data.issuedAt;
  if (data.dueAt !== undefined) patch.due_at = data.dueAt;
  if (data.filePath !== undefined) patch.file_path = data.filePath;
  if (data.fileName !== undefined) patch.file_name = data.fileName;
  if (data.fileMime !== undefined) patch.file_mime = data.fileMime;
  if (data.fileHash !== undefined) patch.file_hash = data.fileHash;
  if (data.fileSize !== undefined) patch.file_size = data.fileSize;
  void supabase.from("invoices").update(patch).eq("id", id);
}

export function persistThread(item: ChatThread, mode: "upsert" | "delete" = "upsert") {
  if (!isOfficialCloud() || !supabase || !currentWorkspaceId()) return;
  if (mode === "delete") {
    void supabase.from("chat_threads").delete().eq("id", item.id);
    return;
  }
  void supabase.from("chat_threads").upsert(threadRow(item));
}

export function persistMessage(item: ChatMessage) {
  if (!isOfficialCloud() || !supabase || !currentWorkspaceId()) return;
  void supabase.from("chat_messages").upsert(messageRow(item));
}
