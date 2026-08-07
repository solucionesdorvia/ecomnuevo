// Slug estable por nombre de proveedor. Se usa para encontrar la portada
// generada en public/fabricas/<slug>-cover.jpg (mismo algoritmo en
// scripts/gen-covers.py). Estable ante re-seeds porque depende del nombre.
export function supplierSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Bio pública corta por fábrica (keyed por slug). Comunica de dónde viene y qué hace.
const BIOS: Record<string, string> = {
  "union-home":
    "Agencia de sourcing en el corazón de Yiwu, China — el mercado de commodities más grande del mundo. Conecta negocios internacionales con productos de calidad a buen precio.",
  "shenzhen-tech-trading-co":
    "Trading de electrónica de consumo en Shenzhen, el polo tecnológico de China.",
  "guangzhou-home-living-ltd":
    "Fabricante de electrodomésticos y artículos para el hogar en Guangzhou.",
  "miami-gadgets-llc": "Distribuidora de gadgets y tecnología en Miami, Estados Unidos.",
  "textil-valencia-s-l":
    "Textil y confección en Valencia, España — lino, algodón y géneros de calidad.",
  "yiwu-tools-hardware-co": "Herramientas y ferretería desde Yiwu, China.",
};

export function supplierBio(name: string): string {
  return BIOS[supplierSlug(name)] ?? "Proveedor del exterior verificado por Traelo.";
}
