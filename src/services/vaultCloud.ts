import type { VaultBlob, VaultFileCipher } from "@/lib/vaultCrypto";
import { packVaultFile, unpackVaultFile } from "@/lib/vaultCrypto";
import { currentWorkspaceId, isOfficialCloud } from "@/services/core";
import { dropWorkspaceFile, getWorkspaceFile, putWorkspaceFile } from "@/services/blobs";
import { supabase } from "@/services/supabase";

function ready() {
  return Boolean(isOfficialCloud() && supabase && currentWorkspaceId());
}

export async function loadVaultCipherCloud(userId: string): Promise<VaultBlob | null> {
  if (!ready() || !supabase) return null;
  const { data, error } = await supabase
    .from("vault_ciphers")
    .select("v, salt, iv, iter, data")
    .eq("user_id", userId)
    .eq("workspace_id", currentWorkspaceId())
    .maybeSingle();
  if (error || !data) return null;
  return {
    v: 1,
    salt: String(data.salt),
    iv: String(data.iv),
    iter: Number(data.iter) || 0,
    data: String(data.data),
  };
}

export async function saveVaultCipherCloud(userId: string, blob: VaultBlob) {
  if (!ready() || !supabase) return;
  const { error } = await supabase.from("vault_ciphers").upsert({
    user_id: userId,
    workspace_id: currentWorkspaceId(),
    v: blob.v,
    salt: blob.salt,
    iv: blob.iv,
    iter: blob.iter,
    data: blob.data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function deleteVaultCipherCloud(userId: string) {
  if (!ready() || !supabase) return;
  await supabase.from("vault_ciphers").delete().eq("user_id", userId).eq("workspace_id", currentWorkspaceId());
}

export async function saveVaultFileCloud(userId: string, itemId: string, cipher: VaultFileCipher) {
  if (!ready()) return;
  await putWorkspaceFile("vault", userId, packVaultFile(cipher), itemId, "application/json");
}

export async function loadVaultFileCloud(userId: string, itemId: string) {
  if (!ready()) return null;
  const wid = currentWorkspaceId();
  if (!wid) return null;
  const blob = await getWorkspaceFile(`${wid}/vault/${userId}/${itemId}`);
  if (!blob) return null;
  try {
    return await unpackVaultFile(blob);
  } catch {
    return null;
  }
}

export async function deleteVaultFileCloud(userId: string, itemId: string) {
  if (!ready()) return;
  const wid = currentWorkspaceId();
  if (!wid) return;
  await dropWorkspaceFile(`${wid}/vault/${userId}/${itemId}`);
}
