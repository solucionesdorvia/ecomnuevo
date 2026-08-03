import type { Category } from "@prisma/client";

export const CATEGORY_BY_KEY: Record<string, Category> = {
  electronica: "ELECTRONICA",
  hogar: "HOGAR",
  indumentaria: "INDUMENTARIA",
  herramientas: "HERRAMIENTAS",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  ELECTRONICA: "Electrónica",
  HOGAR: "Hogar",
  INDUMENTARIA: "Indumentaria",
  HERRAMIENTAS: "Herramientas",
};

export const CATEGORY_KEY: Record<Category, string> = {
  ELECTRONICA: "electronica",
  HOGAR: "hogar",
  INDUMENTARIA: "indumentaria",
  HERRAMIENTAS: "herramientas",
};
