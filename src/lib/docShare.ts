import type { DocumentFile, DocumentShareMode } from "@/types";

export function documentShareMode(doc: DocumentFile): DocumentShareMode {
  return doc.shareMode ?? "team";
}

export function canSeeDocument(doc: DocumentFile, userId?: string | null): boolean {
  if (!userId) return false;
  if (doc.ownerId === userId) return true;
  const mode = documentShareMode(doc);
  if (mode === "team") return true;
  if (mode === "people") return (doc.sharedWith ?? []).includes(userId);
  return false;
}

export function canManageDocument(doc: DocumentFile, userId?: string | null): boolean {
  return Boolean(userId && doc.ownerId === userId);
}

export function isSharedWithMe(doc: DocumentFile, userId?: string | null): boolean {
  if (!userId || doc.ownerId === userId) return false;
  return documentShareMode(doc) === "people" && (doc.sharedWith ?? []).includes(userId);
}

export function shareBadge(doc: DocumentFile): {
  label: string;
  tone: "neutral" | "blue" | "mint";
} {
  const mode = documentShareMode(doc);
  if (mode === "team") return { label: "Equipe", tone: "blue" };
  const n = mode === "people" ? (doc.sharedWith ?? []).length : 0;
  if (n === 0) return { label: "Só você", tone: "neutral" };
  return { label: n === 1 ? "1 pessoa" : `${n} pessoas`, tone: "mint" };
}
