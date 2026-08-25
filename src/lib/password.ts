function hex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string, salt: string) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  return hex(await crypto.subtle.digest("SHA-256", bytes));
}

export function newSalt() {
  return crypto.randomUUID();
}

export async function verifyPassword(password: string, salt: string, hash: string) {
  return (await hashPassword(password, salt)) === hash;
}
