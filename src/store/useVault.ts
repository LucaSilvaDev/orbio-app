import { create } from "zustand";
import { uid } from "@/lib/cn";
import { getWorkspace } from "@/lib/workspace";
import {
  decryptBytes,
  decryptWithKey,
  encryptBytes,
  encryptWithKey,
  isValidPin,
  openVault,
  pinProblem,
  sealVault,
  type VaultItem,
  type VaultKind,
  type VaultPayload,
} from "@/lib/vaultCrypto";
import {
  clearLockState,
  clearSessionKeyObj,
  deleteVaultBlob,
  deleteVaultFile,
  deleteVaultFilesForRecord,
  hasSessionMarker,
  loadVaultBlob,
  loadVaultFile,
  readKeepPref,
  readLockState,
  readSessionKeyObj,
  saveVaultBlob,
  saveVaultFile,
  vaultFileKey,
  vaultRecordId,
  writeKeepPref,
  writeLockState,
  writeSessionKeyObj,
} from "@/lib/vaultDb";

export type { VaultItem, VaultKind };

type Status = "booting" | "setup" | "locked" | "unlocked";

type Draft = {
  id?: string;
  title: string;
  kind: VaultKind;
  username: string;
  secret: string;
  notes: string;
  file?: File | null;
  fileName?: string;
  fileMime?: string;
  fileSize?: number;
};

let cryptoKey: CryptoKey | null = null;
let blobSalt = "";
let blobIter = 0;
let ownerId = "";

const FAIL_WINDOW_MS = 30_000;

type VaultState = {
  status: Status;
  recordId: string;
  items: VaultItem[];
  keepSession: boolean;
  busy: boolean;
  error: string;
  fails: number;
  lockedUntil: number;
  boot: (userId: string) => Promise<void>;
  setup: (pin: string, confirm: string) => Promise<boolean>;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
  setKeepSession: (value: boolean) => Promise<void>;
  upsertItem: (draft: Draft) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  loadFile: (id: string) => Promise<Blob>;
  rotatePin: (current: string, next: string) => Promise<boolean>;
  destroy: () => Promise<void>;
};

function emptyPayload(): VaultPayload {
  return { v: 1, items: [] };
}

function wipeMemory() {
  cryptoKey = null;
  blobSalt = "";
  blobIter = 0;
}

async function persist(items: VaultItem[]) {
  if (!cryptoKey || !ownerId) throw new Error("Cofre fechado");
  const blob = await encryptWithKey(cryptoKey, { v: 1, items }, blobSalt, blobIter);
  await saveVaultBlob(ownerId, blob);
}

export const useVault = create<VaultState>((set, get) => ({
  status: "booting",
  recordId: "",
  items: [],
  keepSession: true,
  busy: false,
  error: "",
  fails: 0,
  lockedUntil: 0,

  boot: async (userId) => {
    const recordId = vaultRecordId(getWorkspace(), userId);
    ownerId = recordId;
    const keepSession = readKeepPref(recordId);
    const lockState = readLockState(recordId);
    const blob = await loadVaultBlob(recordId);
    if (!blob) {
      wipeMemory();
      await clearSessionKeyObj(recordId);
      clearLockState(recordId);
      set({
        status: "setup",
        recordId,
        items: [],
        keepSession,
        error: "",
        fails: 0,
        lockedUntil: 0,
      });
      return;
    }

    if (keepSession && hasSessionMarker(recordId)) {
      const key = await readSessionKeyObj(recordId);
      if (key) {
        try {
          const payload = await decryptWithKey(key, blob);
          cryptoKey = key;
          blobSalt = blob.salt;
          blobIter = blob.iter;
          set({
            status: "unlocked",
            recordId,
            items: payload.items,
            keepSession,
            error: "",
            fails: 0,
            lockedUntil: 0,
          });
          return;
        } catch {
          await clearSessionKeyObj(recordId);
        }
      }
    } else {
      await clearSessionKeyObj(recordId);
    }

    wipeMemory();
    set({
      status: "locked",
      recordId,
      items: [],
      keepSession,
      error: "",
      fails: lockState.fails,
      lockedUntil: lockState.lockedUntil,
    });
  },

  setup: async (pin, confirm) => {
    const problem = pinProblem(pin);
    if (problem) {
      set({ error: problem });
      return false;
    }
    if (pin !== confirm) {
      set({ error: "Os PINs não conferem." });
      return false;
    }
    set({ busy: true, error: "" });
    try {
      const blob = await sealVault(pin, emptyPayload());
      const opened = await openVault(pin, blob);
      await saveVaultBlob(get().recordId, blob);
      cryptoKey = opened.key;
      blobSalt = blob.salt;
      blobIter = blob.iter;
      if (get().keepSession) await writeSessionKeyObj(get().recordId, opened.key);
      clearLockState(get().recordId);
      set({ status: "unlocked", items: [], busy: false, error: "", fails: 0 });
      return true;
    } catch {
      set({ busy: false, error: "Não deu para criar o cofre." });
      return false;
    }
  },

  unlock: async (pin) => {
    const now = Date.now();
    if (now < get().lockedUntil) {
      const wait = Math.ceil((get().lockedUntil - now) / 1000);
      set({ error: `Aguarde ${wait}s e tente de novo.` });
      return false;
    }
    if (!isValidPin(pin)) {
      set({ error: "PIN numérico, no mínimo 6 dígitos." });
      return false;
    }
    set({ busy: true, error: "" });
    try {
      const blob = await loadVaultBlob(get().recordId);
      if (!blob) {
        set({ busy: false, status: "setup" });
        return false;
      }
      const opened = await openVault(pin, blob);
      cryptoKey = opened.key;
      blobSalt = blob.salt;
      blobIter = blob.iter;
      if (get().keepSession) await writeSessionKeyObj(get().recordId, opened.key);
      else await clearSessionKeyObj(get().recordId);
      clearLockState(get().recordId);
      set({
        status: "unlocked",
        items: opened.payload.items,
        busy: false,
        error: "",
        fails: 0,
        lockedUntil: 0,
      });
      return true;
    } catch {
      const fails = get().fails + 1;
      const lockedUntil = fails >= 5 ? Date.now() + FAIL_WINDOW_MS * Math.min(fails - 4, 4) : 0;
      writeLockState(get().recordId, { fails, lockedUntil });
      set({
        busy: false,
        error: "PIN incorreto.",
        fails,
        lockedUntil,
      });
      return false;
    }
  },

  lock: () => {
    wipeMemory();
    void clearSessionKeyObj(get().recordId);
    if (get().status === "setup") return;
    set({ status: get().recordId ? "locked" : "booting", items: [], error: "", busy: false });
  },

  setKeepSession: async (value) => {
    writeKeepPref(get().recordId, value);
    set({ keepSession: value });
    if (!cryptoKey) {
      if (!value) await clearSessionKeyObj(get().recordId);
      return;
    }
    if (value) await writeSessionKeyObj(get().recordId, cryptoKey);
    else await clearSessionKeyObj(get().recordId);
  },

  upsertItem: async (draft) => {
    if (!cryptoKey || !ownerId) throw new Error("Cofre fechado");
    const now = new Date().toISOString();
    const items = get().items;
    const id = draft.id ?? uid("v");
    const existing = items.find((item) => item.id === id);
    const isFile = draft.kind === "file";
    let fileName = isFile ? (draft.file?.name ?? existing?.fileName ?? draft.fileName ?? "") : undefined;
    let fileMime = isFile ? (draft.file?.type || existing?.fileMime || draft.fileMime || "application/octet-stream") : undefined;
    let fileSize = isFile ? (draft.file?.size ?? existing?.fileSize ?? draft.fileSize) : undefined;

    if (isFile && draft.file) {
      const cipher = await encryptBytes(cryptoKey, await draft.file.arrayBuffer());
      await saveVaultFile(vaultFileKey(ownerId, id), cipher);
      fileName = draft.file.name;
      fileMime = draft.file.type || "application/octet-stream";
      fileSize = draft.file.size;
    } else if (!isFile) {
      await deleteVaultFile(vaultFileKey(ownerId, id));
    }

    const row: VaultItem = {
      id,
      title: draft.title.trim(),
      kind: draft.kind,
      username: isFile ? "" : draft.username.trim(),
      secret: isFile ? "" : draft.secret,
      notes: draft.notes.trim(),
      fileName,
      fileMime,
      fileSize,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const next = draft.id ? items.map((item) => (item.id === id ? row : item)) : [row, ...items];
    await persist(next);
    set({ items: next });
  },

  removeItem: async (id) => {
    const next = get().items.filter((item) => item.id !== id);
    if (ownerId) await deleteVaultFile(vaultFileKey(ownerId, id));
    await persist(next);
    set({ items: next });
  },

  loadFile: async (id) => {
    if (!cryptoKey || !ownerId) throw new Error("Cofre fechado");
    const cipher = await loadVaultFile(vaultFileKey(ownerId, id));
    if (!cipher) throw new Error("Arquivo ausente");
    const bytes = await decryptBytes(cryptoKey, cipher);
    const item = get().items.find((row) => row.id === id);
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return new Blob([copy], { type: item?.fileMime || "application/octet-stream" });
  },

  rotatePin: async (current, nextPin) => {
    const problem = pinProblem(nextPin);
    if (problem) {
      set({ error: problem });
      return false;
    }
    set({ busy: true, error: "" });
    try {
      const blob = await loadVaultBlob(get().recordId);
      if (!blob) throw new Error("missing");
      const opened = await openVault(current, blob);
      const sealed = await sealVault(nextPin, { v: 1, items: opened.payload.items });
      const again = await openVault(nextPin, sealed);
      await saveVaultBlob(get().recordId, sealed);
      for (const item of opened.payload.items) {
        if (item.kind !== "file") continue;
        const stored = await loadVaultFile(vaultFileKey(get().recordId, item.id));
        if (!stored) continue;
        const plain = await decryptBytes(opened.key, stored);
        await saveVaultFile(
          vaultFileKey(get().recordId, item.id),
          await encryptBytes(again.key, plain),
        );
      }
      cryptoKey = again.key;
      blobSalt = sealed.salt;
      blobIter = sealed.iter;
      if (get().keepSession) await writeSessionKeyObj(get().recordId, again.key);
      set({ busy: false, error: "", items: opened.payload.items });
      return true;
    } catch {
      set({ busy: false, error: "PIN atual incorreto." });
      return false;
    }
  },

  destroy: async () => {
    await deleteVaultFilesForRecord(get().recordId);
    await deleteVaultBlob(get().recordId);
    wipeMemory();
    await clearSessionKeyObj(get().recordId);
    clearLockState(get().recordId);
    set({ status: "setup", items: [], error: "", fails: 0, lockedUntil: 0 });
  },
}));

export function lockVaultNow() {
  useVault.getState().lock();
}
