import type { VaultBlob, VaultFileCipher } from "@/lib/vaultCrypto"

const DB_NAME = "orbio-vault"
const STORE = "ciphers"
const FILES = "files"
const SESSION_KEYS = "sessionKeys"
const PREF_PREFIX = "orbio-vault-keep"
const SESSION_MARKER_PREFIX = "orbio-vault-session"
const LOCK_PREFIX = "orbio-vault-lock"

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 3)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
      if (!db.objectStoreNames.contains(FILES)) db.createObjectStore(FILES)
      if (!db.objectStoreNames.contains(SESSION_KEYS)) db.createObjectStore(SESSION_KEYS)
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

export function readKeepPref(id: string) {
  return localStorage.getItem(keepPrefKey(id)) !== "0"
}

export function writeKeepPref(id: string, value: boolean) {
  localStorage.setItem(keepPrefKey(id), value ? "1" : "0")
}

// The unwrapped vault key must never touch localStorage/sessionStorage: those are
// plain strings, exfiltratable by any script that runs in this origin (XSS, a
// compromised extension, a supply-chain-poisoned dependency). Instead we keep a
// non-extractable CryptoKey object in IndexedDB (crypto.subtle can still use it to
// encrypt/decrypt, but no script can ever read out its raw bytes) and gate access to
// it behind a sessionStorage marker, so it still behaves like session storage: it
// survives a reload but a fresh tab session (no marker) treats it as absent.
function sessionMarkerName(id: string) {
  return `${SESSION_MARKER_PREFIX}:${id}`
}

export function hasSessionMarker(id: string) {
  try {
    return sessionStorage.getItem(sessionMarkerName(id)) === "1"
  } catch {
    return false
  }
}

function setSessionMarker(id: string) {
  try {
    sessionStorage.setItem(sessionMarkerName(id), "1")
  } catch {
    // ignore
  }
}

function clearSessionMarker(id: string) {
  try {
    sessionStorage.removeItem(sessionMarkerName(id))
  } catch {
    // ignore
  }
}

export function readSessionKeyObj(id: string) {
  return withStore<CryptoKey | undefined>(SESSION_KEYS, "readonly", (store) => store.get(id)).then(
    (row) => row ?? null,
  )
}

export function writeSessionKeyObj(id: string, key: CryptoKey) {
  setSessionMarker(id)
  return withStore(SESSION_KEYS, "readwrite", (store) => store.put(key, id)).then(() => undefined)
}

export function clearSessionKeyObj(id: string) {
  clearSessionMarker(id)
  return withStore(SESSION_KEYS, "readwrite", (store) => store.delete(id)).then(() => undefined)
}

// Failed-unlock lockout, persisted so a page reload can't reset a brute-force
// throttle against the offline-decryptable vault blob.
type LockState = { fails: number; lockedUntil: number }

function lockKey(id: string) {
  return `${LOCK_PREFIX}:${id}`
}

export function readLockState(id: string): LockState {
  try {
    const raw = localStorage.getItem(lockKey(id))
    if (!raw) return { fails: 0, lockedUntil: 0 }
    const parsed = JSON.parse(raw)
    return { fails: Number(parsed.fails) || 0, lockedUntil: Number(parsed.lockedUntil) || 0 }
  } catch {
    return { fails: 0, lockedUntil: 0 }
  }
}

export function writeLockState(id: string, state: LockState) {
  try {
    localStorage.setItem(lockKey(id), JSON.stringify(state))
  } catch {
    // ignore
  }
}

export function clearLockState(id: string) {
  localStorage.removeItem(lockKey(id))
}
