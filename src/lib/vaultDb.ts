import type { VaultBlob, VaultFileCipher } from "@/lib/vaultCrypto"

const DB_NAME = "orbio-vault"
const STORE = "ciphers"
const FILES = "files"
const PREF_PREFIX = "orbio-vault-keep"
const SESSION_PREFIX = "orbio-vault-key"

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
      if (!db.objectStoreNames.contains(FILES)) db.createObjectStore(FILES)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
) {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode)
        const request = run(tx.objectStore(storeName))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
        tx.oncomplete = () => db.close()
      }),
  )
}

export function vaultRecordId(workspace: string, userId: string) {
  return `${workspace}:${userId}`
}

export function vaultFileKey(recordId: string, itemId: string) {
  return `${recordId}:${itemId}`
}

export function loadVaultBlob(id: string) {
  return withStore<VaultBlob | undefined>(STORE, "readonly", (store) => store.get(id)).then(
    (row) => row ?? null,
  )
}

export function saveVaultBlob(id: string, blob: VaultBlob) {
  return withStore(STORE, "readwrite", (store) => store.put(blob, id)).then(() => undefined)
}

export function deleteVaultBlob(id: string) {
  return withStore(STORE, "readwrite", (store) => store.delete(id)).then(() => undefined)
}

export function loadVaultFile(id: string) {
  return withStore<VaultFileCipher | undefined>(FILES, "readonly", (store) => store.get(id)).then(
    (row) => row ?? null,
  )
}

export function saveVaultFile(id: string, cipher: VaultFileCipher) {
  return withStore(FILES, "readwrite", (store) => store.put(cipher, id)).then(() => undefined)
}

export function deleteVaultFile(id: string) {
  return withStore(FILES, "readwrite", (store) => store.delete(id)).then(() => undefined)
}

export function deleteVaultFilesForRecord(recordId: string) {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(FILES, "readwrite")
        const store = tx.objectStore(FILES)
        const cursorReq = store.openCursor()
        const prefix = `${recordId}:`
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result
          if (!cursor) return
          if (String(cursor.key).startsWith(prefix)) cursor.delete()
          cursor.continue()
        }
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () => reject(tx.error)
      }),
  )
}

export function keepPrefKey(id: string) {
  return `${PREF_PREFIX}:${id}`
}

export function sessionKeyName(id: string) {
  return `${SESSION_PREFIX}:${id}`
}

export function readKeepPref(id: string) {
  return localStorage.getItem(keepPrefKey(id)) !== "0"
}

export function writeKeepPref(id: string, value: boolean) {
  localStorage.setItem(keepPrefKey(id), value ? "1" : "0")
}

export function readSessionKey(id: string) {
  try {
    return sessionStorage.getItem(sessionKeyName(id))
  } catch {
    return null
  }
}

export function writeSessionKey(id: string, raw: string) {
  sessionStorage.setItem(sessionKeyName(id), raw)
}

export function clearSessionKey(id: string) {
  sessionStorage.removeItem(sessionKeyName(id))
}
