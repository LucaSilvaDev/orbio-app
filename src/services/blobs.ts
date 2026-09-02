import { currentWorkspaceId, isOfficialCloud } from "@/services/core";
import { supabase } from "@/services/supabase";
import { objectPath, sha256Hex, type ObjectKind } from "@/lib/durablePath";

const BUCKET = "workspace";

function client() {
  if (!isOfficialCloud() || !supabase) throw new Error("storage offline");
  const workspaceId = currentWorkspaceId();
  if (!workspaceId) throw new Error("sem workspace");
  return { supabase, workspaceId };
}

export async function putWorkspaceFile(
  kind: ObjectKind,
  recordId: string,
  file: Blob,
  fileName: string,
  contentType = file.type || "application/octet-stream",
) {
  const { supabase: db, workspaceId } = client();
  const path = objectPath(workspaceId, kind, recordId, fileName);
  const bytes = await file.arrayBuffer();
  const hash = await sha256Hex(bytes);
  const { error } = await db.storage.from(BUCKET).upload(path, new Blob([bytes], { type: contentType }), {
    upsert: true,
    contentType,
  });
  if (error) throw error;
  return { path, hash, size: bytes.byteLength };
}

export async function getWorkspaceFile(path: string) {
  if (!path || !supabase) return null;
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  return data;
}

export async function dropWorkspaceFile(path: string) {
  if (!path || !supabase) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

export async function signedWorkspaceUrl(path: string, expiresIn = 120) {
  if (!path || !supabase) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data.signedUrl;
}
