export const money = (cents: number) =>
  `Bs ${(cents / 100).toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const date = (value: string) =>
  new Date(value).toLocaleDateString("es-BO", {
    day: "numeric",
    month: "short",
    timeZone: "America/La_Paz",
  });
export const orderState = (value: string) =>
  ({
    RECEIVED: "Recibido",
    CONFIRMED: "Confirmado",
    PREPARING: "En preparación",
    READY_FOR_PICKUP: "Listo para recoger",
    CUSTOMER_ARRIVED: "Llegada avisada",
    DELIVERED: "Entregado",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
  })[value] || value;
export const tierName = (value?: string) =>
  ({ BRONZE: "Bronce", SILVER: "Plata", GOLD: "Oro" })[value || ""] ||
  "Mi Paseo";
export function visitToken(raw: string, publicOrigin: string): string | null {
  try {
    const url = new URL(raw);
    if (
      url.protocol !== "paseoaranjuez:" &&
      (!publicOrigin || url.origin !== new URL(publicOrigin).origin)
    )
      return null;
    const path =
      url.protocol === "paseoaranjuez:"
        ? "/" + url.host + url.pathname
        : url.pathname;
    return /^\/visita\/([A-Za-z0-9_-]{32})\/?$/.exec(path)?.[1] ?? null;
  } catch {
    return null;
  }
}
