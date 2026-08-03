import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password (scrypt)", () => {
  it("hash y verificación redondos", async () => {
    const hash = await hashPassword("ecomex123");
    expect(await verifyPassword("ecomex123", hash)).toBe(true);
  });

  it("rechaza contraseña incorrecta", async () => {
    const hash = await hashPassword("ecomex123");
    expect(await verifyPassword("ecomex124", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
  });

  it("dos hashes de la misma contraseña difieren (salt aleatorio)", async () => {
    expect(await hashPassword("x")).not.toBe(await hashPassword("x"));
  });

  it("no explota con hashes malformados", async () => {
    expect(await verifyPassword("x", "basura")).toBe(false);
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "solo-salt:")).toBe(false);
  });
});
