import { describe, expect, it } from "vitest";
import { can, isAdmin, isReadOnly } from "@/store/usePermissions";

describe("permissões por papel (espelham as políticas do banco)", () => {
  it("demo/sem papel nunca bloqueia", () => {
    expect(can(null, "crm")).toBe(true);
    expect(can(null, "finance")).toBe(true);
  });

  it("leitura não escreve em nada", () => {
    expect(can("viewer", "crm")).toBe(false);
    expect(can("viewer", "finance")).toBe(false);
    expect(can("viewer", "any")).toBe(false);
    expect(isReadOnly("viewer")).toBe(true);
  });

  it("vendedor edita CRM mas não faturas", () => {
    expect(can("sales", "crm")).toBe(true);
    expect(can("sales", "any")).toBe(true);
    expect(can("sales", "finance")).toBe(false);
  });

  it("financeiro edita faturas mas não o CRM comercial", () => {
    expect(can("finance", "finance")).toBe(true);
    expect(can("finance", "any")).toBe(true);
    expect(can("finance", "crm")).toBe(false);
  });

  it("dono e administrador podem tudo; só eles administram", () => {
    for (const role of ["owner", "admin"] as const) {
      expect(can(role, "crm") && can(role, "finance") && can(role, "any")).toBe(true);
      expect(isAdmin(role)).toBe(true);
    }
    expect(isAdmin("sales")).toBe(false);
  });
});
