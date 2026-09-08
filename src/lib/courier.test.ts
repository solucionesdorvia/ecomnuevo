import { describe, expect, it } from "vitest";
import { checkCourierLimits, MAX_TOTAL_USD, MAX_UNITS_PER_SPECIES, MAX_WEIGHT_KG } from "./courier";

describe("checkCourierLimits", () => {
  it("aprueba un carrito dentro de los topes", () => {
    const r = checkCourierLimits(100, 5);
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("aprueba exactamente en el tope (el tope es inclusivo)", () => {
    const r = checkCourierLimits(MAX_TOTAL_USD, MAX_WEIGHT_KG);
    expect(r.ok).toBe(true);
  });

  it("rechaza por valor", () => {
    const r = checkCourierLimits(MAX_TOTAL_USD + 0.01, 1);
    expect(r.ok).toBe(false);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0].replace(/ /g, " ")).toMatch(/supera el tope de US\$ 3\.000/);
    expect(r.errors[0]).toMatch(/Dividí la compra/);
  });

  it("rechaza por peso", () => {
    const r = checkCourierLimits(100, MAX_WEIGHT_KG + 0.1);
    expect(r.ok).toBe(false);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toMatch(/supera el tope de 50 kg/);
  });

  it("rechaza por ambos a la vez con dos mensajes", () => {
    const r = checkCourierLimits(5000, 80);
    expect(r.ok).toBe(false);
    expect(r.errors).toHaveLength(2);
  });

  it("los ratios se clampean a 1 para las barras de progreso", () => {
    const r = checkCourierLimits(6000, 100);
    expect(r.usdRatio).toBe(1);
    expect(r.weightRatio).toBe(1);
  });

  it("los ratios reflejan la proporción real", () => {
    const r = checkCourierLimits(1500, 25);
    expect(r.usdRatio).toBeCloseTo(0.5);
    expect(r.weightRatio).toBeCloseTo(0.5);
  });

  it("carrito vacío es válido", () => {
    const r = checkCourierLimits(0, 0);
    expect(r.ok).toBe(true);
    expect(r.usdRatio).toBe(0);
  });

  it("aprueba hasta 3 unidades de la misma especie (tope inclusivo)", () => {
    const r = checkCourierLimits(100, 5, [{ label: "Reloj", units: MAX_UNITS_PER_SPECIES }]);
    expect(r.ok).toBe(true);
    expect(r.overSpecies).toHaveLength(0);
  });

  it("rechaza más de 3 unidades de la misma especie", () => {
    const r = checkCourierLimits(100, 5, [{ label: "Reloj", units: 4 }]);
    expect(r.ok).toBe(false);
    expect(r.overSpecies).toEqual([{ label: "Reloj", units: 4 }]);
    expect(r.errors[0]).toMatch(/hasta 3 unidades del mismo producto/);
  });

  it("suma variantes del mismo producto para el tope por especie", () => {
    // la agregación por especie la hace el carrito; acá validamos el chequeo ya agregado
    const r = checkCourierLimits(100, 5, [{ label: "Remera", units: 4 }]);
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toContain("Remera");
  });

  it("acumula el error de especie con los de valor/peso", () => {
    const r = checkCourierLimits(MAX_TOTAL_USD + 1, MAX_WEIGHT_KG + 1, [{ label: "X", units: 5 }]);
    expect(r.errors).toHaveLength(3);
  });
});
