import { currentWorkspaceId, isOfficialCloud } from "@/services/core";
import { dropWorkspaceFile, getWorkspaceFile, putWorkspaceFile } from "@/services/blobs";

const DB_NAME = "orbio-docs";
const STORE = "blobs";

type StoredDoc = {
  blob: Blob;
  mime: string;
  name: string;
};

export type SavedDoc = {
  path?: string;
  hash?: string;
  size: number;
};

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = run(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
      }),
  );
}

export async function saveDocFile(id: string, file: File): Promise<SavedDoc> {
  if (isOfficialCloud() && currentWorkspaceId()) {
    const stored = await putWorkspaceFile("docs", id, file, file.name, file.type);
    return { path: stored.path, hash: stored.hash, size: stored.size };
  }
  const record: StoredDoc = { blob: file, mime: file.type || "application/octet-stream", name: file.name };
  await withStore("readwrite", (store) => store.put(record, id));
  return { size: file.size };
}

export async function loadDocFile(id: string, storagePath?: string) {
  if (storagePath) {
    const blob = await getWorkspaceFile(storagePath);
    if (!blob) return null;
    return { blob, mime: blob.type, name: storagePath.split("/").pop() ?? id };
  }
  if (isOfficialCloud()) return null;
  return withStore<StoredDoc | undefined>("readonly", (store) => store.get(id)).then((row) => row ?? null);
}

export async function deleteDocFile(id: string, storagePath?: string) {
  if (storagePath) await dropWorkspaceFile(storagePath);
  if (isOfficialCloud()) return;
  await withStore("readwrite", (store) => store.delete(id));
}
