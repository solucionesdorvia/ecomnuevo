const NEW_DAYS = 30;

/** ¿El producto es reciente (badge "Nuevo")? Menos de 30 días desde su alta. */
export function esNuevo(createdAt: Date | null | undefined, days = NEW_DAYS): boolean {
  if (!createdAt) return false;
  return Date.now() - createdAt.getTime() < days * 24 * 60 * 60 * 1000;
}
