import { describe, expect, it } from "vitest";
import { FLOW, isValidTransition, validNextStates } from "./estados";

describe("validNextStates", () => {
  it("desde PAGADO: siguiente paso o cancelar", () => {
    expect(validNextStates("PAGADO")).toEqual(["COMPRADO_EN_ORIGEN", "CANCELADO"]);
  });

  it("desde COMPRADO_EN_ORIGEN: siguiente paso o cancelar", () => {
    expect(validNextStates("COMPRADO_EN_ORIGEN")).toEqual(["RECIBIDO_DEPOSITO_EXTERIOR", "CANCELADO"]);
  });

  it("desde RECIBIDO_DEPOSITO_EXTERIOR: todavía se puede cancelar", () => {
    expect(validNextStates("RECIBIDO_DEPOSITO_EXTERIOR")).toEqual(["EMBARCADO", "CANCELADO"]);
  });

  it("desde EMBARCADO ya NO se puede cancelar (regla de negocio)", () => {
    expect(validNextStates("EMBARCADO")).toEqual(["EN_ADUANA"]);
  });

  it("desde EN_ADUANA solo se entrega", () => {
    expect(validNextStates("EN_ADUANA")).toEqual(["ENTREGADO"]);
  });

  it("ENTREGADO y CANCELADO son finales", () => {
    expect(validNextStates("ENTREGADO")).toEqual([]);
    expect(validNextStates("CANCELADO")).toEqual([]);
  });
});

describe("isValidTransition", () => {
  it("no permite saltearse pasos", () => {
    expect(isValidTransition("PAGADO", "EMBARCADO")).toBe(false);
    expect(isValidTransition("PAGADO", "ENTREGADO")).toBe(false);
  });

  it("no permite retroceder", () => {
    expect(isValidTransition("EMBARCADO", "COMPRADO_EN_ORIGEN")).toBe(false);
  });

  it("no permite quedarse en el mismo estado", () => {
    for (const s of FLOW) expect(isValidTransition(s, s)).toBe(false);
  });

  it("el flujo completo paso a paso es válido", () => {
    for (let i = 0; i < FLOW.length - 1; i++) {
      expect(isValidTransition(FLOW[i], FLOW[i + 1])).toBe(true);
    }
  });

  it("no se puede des-cancelar ni des-entregar", () => {
    expect(isValidTransition("CANCELADO", "PAGADO")).toBe(false);
    expect(isValidTransition("ENTREGADO", "EN_ADUANA")).toBe(false);
  });
});
