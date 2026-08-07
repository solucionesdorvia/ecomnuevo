import Image from "next/image";
import { cn } from "@/lib/utils";

// Avatar de fábrica/proveedor. Si hay foto de perfil (src) la usa; si no, cae a
// las iniciales sobre tinta oceánica. On-brand, sin imágenes externas.
function initials(name: string): string {
  const words = name.replace(/[^\p{L}\s]/gu, " ").split(/\s+/).filter(Boolean);
  return (words[0]?.[0] ?? "") + (words[1]?.[0] ?? "");
}

export function SupplierAvatar({
  name,
  src,
  className,
  textClassName,
}: {
  name: string;
  src?: string | null;
  className?: string;
  textClassName?: string;
}) {
  if (src) {
    return (
      <span className={cn("relative shrink-0 overflow-hidden rounded-2xl bg-white", className)}>
        <Image src={src} alt={`Logo de ${name}`} fill sizes="120px" className="object-cover" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary text-white",
        className,
      )}
    >
      <span className={cn("font-display font-extrabold uppercase", textClassName)}>
        {initials(name).toUpperCase()}
      </span>
      <span className="absolute inset-x-0 bottom-0 h-[18%] bg-celeste" />
    </span>
  );
}
