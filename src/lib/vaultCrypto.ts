const ITERATIONS = 310_000
const MIN_PIN = 6
const MAX_PIN = 12

const WEAK_PINS = new Set([
  "000000",
  "111111",
  "222222",
  "123456",
  "654321",
  "123123",
  "121212",
  "112233",
])

export type VaultKind = "password" | "note" | "other" | "file"

export type VaultItem = {
  id: string
  title: string
  kind: VaultKind
  username: string
  secret: string
  notes: string
  fileName?: string
  fileMime?: string
  fileSize?: number
  createdAt: string
  updatedAt: string
}

export type VaultFileCipher = {
  iv: string
  data: ArrayBuffer
}

export type VaultPayload = {
  v: 1
  items: VaultItem[]
}

export type VaultBlob = {
  v: 1
  salt: string
  iv: string
  iter: number
  data: string
}

function bytesToB64(bytes: Uint8Array) {
  let binary = ""
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function b64ToBytes(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function bufToB64(buffer: ArrayBuffer) {
  return bytesToB64(new Uint8Array(buffer))
}

export function isValidPin(pin: string) {
  return new RegExp(`^\\d{${MIN_PIN},${MAX_PIN}}$`).test(pin)
}

export function pinProblem(pin: string) {
  if (!isValidPin(pin)) {
    return `Use só números, de ${MIN_PIN} a ${MAX_PIN} dígitos.`
  }
  if (WEAK_PINS.has(pin) || new Set(pin).size === 1) {
    return "Esse PIN é óbvio demais. Escolha outra combinação."
  }
  return null
}

async function importPin(pin: string) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, [
    "deriveKey",
  ])
}

export async function deriveVaultKey(pin: string, salt: Uint8Array, iterations = ITERATIONS) {
  const saltCopy = new Uint8Array(salt)
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltCopy, iterations, hash: "SHA-256" },
    await importPin(pin),
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  )
}

export async function exportVaultKey(key: CryptoKey) {
  return bufToB64(await crypto.subtle.exportKey("raw", key))
}

export async function importVaultKey(raw: string) {
  return crypto.subtle.importKey("raw", b64ToBytes(raw), { name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ])
}

export async function sealVault(pin: string, payload: VaultPayload): Promise<VaultBlob> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await deriveVaultKey(pin, salt)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(payload)),
  )
  return {
    v: 1,
    salt: bytesToB64(salt),
    iv: bytesToB64(iv),
    iter: ITERATIONS,
    data: bufToB64(data),
  }
}

export async function openVault(pin: string, blob: VaultBlob) {
  const key = await deriveVaultKey(pin, b64ToBytes(blob.salt), blob.iter)
  const payload = await decryptWithKey(key, blob)
  return { key, payload }
}

export async function decryptWithKey(key: CryptoKey, blob: VaultBlob): Promise<VaultPayload> {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBytes(blob.iv) },
    key,
    b64ToBytes(blob.data),
  )
  const parsed = JSON.parse(new TextDecoder().decode(plain)) as VaultPayload
  if (parsed?.v !== 1 || !Array.isArray(parsed.items)) {
    throw new Error("Cofre corrompido")
  }
  return parsed
}

export async function encryptWithKey(key: CryptoKey, payload: VaultPayload, saltB64: string, iter: number) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(payload)),
  )
  return {
    v: 1 as const,
    salt: saltB64,
    iv: bytesToB64(iv),
    iter,
    data: bufToB64(data),
  }
}

export async function encryptBytes(key: CryptoKey, bytes: ArrayBuffer | Uint8Array): Promise<VaultFileCipher> {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  const copy = new Uint8Array(view.byteLength)
  copy.set(view)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, copy)
  return { iv: bytesToB64(iv), data }
}

export async function decryptBytes(key: CryptoKey, cipher: VaultFileCipher) {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBytes(cipher.iv) },
    key,
    cipher.data,
  )
  return new Uint8Array(plain)
}

export { MIN_PIN, MAX_PIN, ITERATIONS }
