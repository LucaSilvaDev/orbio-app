export type ObjectKind = "docs" | "invoices" | "chat" | "vault";

export function sanitizeObjectName(name: string) {
  const stripped = name.replace(/\.\./g, "").trim();
  if (!stripped) return "file";
  const flattened = stripped
    .replace(/[/\\]+/g, "-")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return flattened || "file";
}

function sanitizeSegment(value: string) {
  const cleaned = value.trim().replace(/[/\\]/g, "").replace(/\.\./g, "");
  if (!cleaned) throw new Error("invalid object path segment");
  return cleaned;
}

export function objectPath(
  workspaceId: string,
  kind: ObjectKind,
  recordId: string,
  fileName?: string,
) {
  const workspace = sanitizeSegment(workspaceId);
  const record = sanitizeSegment(recordId);
  if (kind === "vault") {
    const item = sanitizeSegment(fileName ?? "blob");
    return `${workspace}/vault/${record}/${item}`;
  }
  return `${workspace}/${kind}/${record}/${sanitizeObjectName(fileName ?? "file")}`;
}

export async function sha256Hex(data: BufferSource) {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}
