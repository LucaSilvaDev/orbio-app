import type { ChatAttachment, ChatAttachmentKind, DocumentKind } from "@/types";

export const MAX_CHAT_FILE = 1.8 * 1024 * 1024;
export const MAX_DOC_FILE = 20 * 1024 * 1024;
export const MAX_VAULT_FILE = 10 * 1024 * 1024;

export const DOC_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.odt,.ods,.odp,.txt,.rtf,.png,.jpg,.jpeg,.webp,.gif";

export function attachmentKind(mime: string, name: string): ChatAttachmentKind {
  const lower = name.toLowerCase();
  if (mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/.test(lower)) return "image";
  if (mime.includes("pdf") || lower.endsWith(".pdf")) return "pdf";
  if (
    /sheet|excel|csv|spreadsheet/.test(mime) ||
    /\.(csv|xlsx|xls|ods)$/.test(lower)
  ) {
    return "sheet";
  }
  return "file";
}

export function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function filesToAttachments(
  files: FileList | File[],
  opts?: { maxBytes?: number; embed?: boolean },
) {
  const list = Array.from(files);
  const max = opts?.maxBytes ?? MAX_CHAT_FILE;
  const embed = opts?.embed ?? true;
  const attachments: Omit<ChatAttachment, "id">[] = [];
  for (const file of list) {
    if (file.size > max) {
      throw new Error(`${file.name} passa de ${formatBytes(max)}`);
    }
    attachments.push({
      name: file.name,
      mime: file.type || "application/octet-stream",
      size: file.size,
      kind: attachmentKind(file.type, file.name),
      dataUrl: embed ? await readAsDataUrl(file) : undefined,
    });
  }
  return attachments;
}

export function downloadDataUrl(name: string, dataUrl?: string) {
  if (!dataUrl) return;
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = name;
  link.click();
}

export function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function inferDocumentKind(name: string, mime = ""): DocumentKind {
  const lower = name.toLowerCase();
  const type = mime.toLowerCase();
  if (/contrato|contract|msa|nda|aditivo/.test(lower)) return "contract";
  if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/.test(lower)) return "image";
  if (type.includes("pdf") || lower.endsWith(".pdf")) return "pdf";
  if (/sheet|excel|csv|spreadsheet/.test(type) || /\.(csv|xlsx|xls|ods)$/.test(lower)) return "sheet";
  if (/presentation|powerpoint/.test(type) || /\.(pptx?|odp)$/.test(lower)) return "slide";
  if (/word|msword|opendocument.text/.test(type) || /\.(docx?|odt|rtf)$/.test(lower)) return "word";
  return "file";
}

export function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
