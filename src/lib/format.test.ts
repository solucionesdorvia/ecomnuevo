import { describe, expect, it } from "vitest";
import { formatKg, formatUsd } from "./format";

// Normaliza espacios no separables que mete Intl
const n = (s: string) => s.replace(/ | /g, " ");

describe("formatUsd", () => {
  it("formatea en es-AR con US$", () => {
    expect(n(formatUsd(85))).toBe("US$ 85,00");
    expect(n(formatUsd(1234.5))).toBe("US$ 1.234,50");
    expect(n(formatUsd(3000))).toBe("US$ 3.000,00");
  });

  it("acepta strings y Decimals (toNumber)", () => {
    expect(n(formatUsd("85.5"))).toBe("US$ 85,50");
    expect(n(formatUsd({ toNumber: () => 12 }))).toBe("US$ 12,00");
  });
});

describe("formatKg", () => {
  it("formatea con coma decimal y unidad", () => {
    expect(n(formatKg(1.1))).toBe("1,1 kg");
    expect(n(formatKg(57))).toBe("57 kg");
    expect(n(formatKg(0.25))).toBe("0,25 kg");
  });
});
