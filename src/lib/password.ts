const ITERATIONS = 310_000

function bytesToHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

function hexToBytes(hex: string) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  return bytes
}

async function deriveBits(password: string, salt: string) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256,
  )
  return bytesToHex(bits)
}

export async function hashPassword(password: string, salt: string) {
  return `pbkdf2$${ITERATIONS}$${await deriveBits(password, salt)}`
}

export function newSalt() {
  return crypto.randomUUID()
}

function timingSafeEqual(a: string, b: string) {
  const aBytes = hexToBytes(a.padEnd(b.length, "0"))
  const bBytes = hexToBytes(b.padEnd(a.length, "0"))
  if (aBytes.length !== bBytes.length) return false
  let diff = 0
  for (let i = 0; i < aBytes.length; i += 1) diff |= aBytes[i] ^ bBytes[i]
  return diff === 0 && a.length === b.length
}

export async function verifyPassword(password: string, salt: string, hash: string) {
  if (hash.startsWith("pbkdf2$")) {
    const [, , digest] = hash.split("$")
    return timingSafeEqual(await deriveBits(password, salt), digest)
  }
  // Legacy single-round SHA-256 hashes from before the PBKDF2 migration.
  const legacy = bytesToHex(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${password}`)),
  )
  return timingSafeEqual(legacy, hash)
}
