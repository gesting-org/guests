// ============================================================
//  HOST CONFIGURATION  —  Editá estos valores antes de compartir
// ============================================================

export const MARKUP_PERCENTAGE        = 20;
export const MERCADOPAGO_PUBLIC_KEY   = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY ?? '';

// ── WhatsApp (CallMeBot) ─────────────────────────────────────
//
//  Para activar las notificaciones automáticas al host:
//  1. Mandá "I allow callmebot to send me messages" al +34664059217 por WhatsApp
//  2. Recibirás tu API key por WhatsApp
//  3. Completá VITE_HOST_WHATSAPP y VITE_CALLMEBOT_API_KEY en .env (o en Vercel)
//
//  Más info: https://www.callmebot.com/blog/free-api-whatsapp-messages/
//
export const HOST_WHATSAPP     = import.meta.env.VITE_HOST_WHATSAPP     ?? "";
export const CALLMEBOT_API_KEY = import.meta.env.VITE_CALLMEBOT_API_KEY ?? "";

// ── Fecha formateada ─────────────────────────────────────────
export function formatDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
  });
}
