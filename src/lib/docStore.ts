const DB_NAME = "orbio-docs";
const STORE = "blobs";

type StoredDoc = {
  blob: Blob;
  mime: string;
  name: string;
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

export function saveDocFile(id: string, file: File) {
  const record: StoredDoc = { blob: file, mime: file.type || "application/octet-stream", name: file.name };
  return withStore("readwrite", (store) => store.put(record, id));
}

export function loadDocFile(id: string) {
  return withStore<StoredDoc | undefined>("readonly", (store) => store.get(id)).then((row) => row ?? null);
}

export function deleteDocFile(id: string) {
  return withStore("readwrite", (store) => store.delete(id)).then(() => undefined);
}