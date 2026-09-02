import { describe, expect, it } from "vitest";
import { objectPath, sanitizeObjectName, sha256Hex } from "@/lib/durablePath";

describe("objectPath", () => {
  it("nests blob under workspace, kind, and record id", () => {
    expect(objectPath("a1b2c3d4-e5f6-7890-abcd-ef1234567890", "docs", "doc-1", "boleto.pdf")).toBe(
      "a1b2c3d4-e5f6-7890-abcd-ef1234567890/docs/doc-1/boleto.pdf",
    );
  });

  it("strips path traversal and slashes from the file name", () => {
    expect(objectPath("wid", "invoices", "inv-1", "../../etc/passwd")).toBe(
      "wid/invoices/inv-1/etc-passwd",
    );
    expect(objectPath("wid", "chat", "msg-1", "pasta/boleto 1.PDF")).toBe(
      "wid/chat/msg-1/pasta-boleto-1.PDF",
    );
  });

  it("keeps vault ciphertext off the shared docs tree", () => {
    expect(objectPath("wid", "vault", "user-9", "item-3")).toBe("wid/vault/user-9/item-3");
  });
});

describe("sanitizeObjectName", () => {
  it("rejects empty names", () => {
    expect(sanitizeObjectName("")).toBe("file");
    expect(sanitizeObjectName("   ")).toBe("file");
  });
});

describe("sha256Hex", () => {
  it("hashes the NIST vector for abc", async () => {
    const bytes = new TextEncoder().encode("abc");
    await expect(sha256Hex(bytes)).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});
