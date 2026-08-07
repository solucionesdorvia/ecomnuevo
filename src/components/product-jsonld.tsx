// Datos estructurados schema.org/Product para que Google muestre el producto
// con precio y disponibilidad (rich results / Google Shopping). Invisible al
// usuario; puro SEO.

const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const abs = (u: string) => (u.startsWith("http") ? u : `${base}${u.startsWith("/") ? "" : "/"}${u}`);

export function ProductJsonLd({
  slug,
  title,
  description,
  images,
  priceUsd,
  active,
  category,
}: {
  slug: string;
  title: string;
  description: string;
  images: string[];
  priceUsd: number;
  active: boolean;
  category: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description: description.replace(/\s+/g, " ").trim().slice(0, 300),
    image: images.map(abs),
    category,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: priceUsd.toFixed(2),
      availability: active ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      url: `${base}/p/${slug}`,
      seller: { "@type": "Organization", name: "Traelo" },
    },
  };
  return (
    <script
      type="application/ld+json"
      // JSON serializado por nosotros, sin datos del usuario: seguro
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
