import { HOST_WHATSAPP, CALLMEBOT_API_KEY, formatDate } from './config.js';
import { supabase } from './supabase.js';

function isSupabaseReady() {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

// ─── Guarda el pedido en Supabase ─────────────────────────────────────────────
async function saveOrder(orderInfo) {
  if (!isSupabaseReady()) return;
  try {
    const totalARS = orderInfo.items.reduce((s, i) => s + i.product.price * i.quantity, 0);
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        guest_name:    orderInfo.guestName,
        property_name: orderInfo.propertyName,
        checkin_date:  orderInfo.checkinDate,
        total_ars:     totalARS,
        notes:         orderInfo.notes ?? '',
        status:        'pending',
      })
      .select()
      .single();
    if (error) throw error;

    const items = orderInfo.items.map((i) => ({
      order_id:     order.id,
      product_name: i.product.name,
      quantity:     i.quantity,
      price_ars:    i.product.price,
    }));
    await supabase.from('order_items').insert(items);
  } catch (err) {
    console.error('Error guardando pedido en Supabase:', err);
  }
}

// ─── Mensaje de WhatsApp ──────────────────────────────────────────────────────
function buildMessage(orderInfo) {
  const fmt = (n) => '$' + Math.round(n).toLocaleString('es-AR');
  const items = orderInfo.items
    .map((i) => `• ${i.product.name} ×${i.quantity} — ${fmt(i.product.price * i.quantity)}`)
    .join('\n');
  const realTotal = orderInfo.items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  return [
    '🛒 *Nuevo pedido — gestin*',
    '',
    `👤 Huésped: *${orderInfo.guestName}*`,
    `🏠 Propiedad: ${orderInfo.propertyName}`,
    `📅 Check-in: ${formatDate(orderInfo.checkinDate)}`,
    '',
    '*Productos:*',
    items,
    '',
    `💰 *Total: ${fmt(realTotal)}*`,
    orderInfo.notes ? `💬 Nota: "${orderInfo.notes}"` : '',
  ].filter(Boolean).join('\n').trim();
}

// ─── Notifica al host ─────────────────────────────────────────────────────────
export async function notifyHost(orderInfo) {
  // Siempre guarda en Supabase (si está configurado)
  await saveOrder(orderInfo);

  const message = buildMessage(orderInfo);

  if (!HOST_WHATSAPP || !CALLMEBOT_API_KEY) {
    const text = encodeURIComponent(message);
    const fallbackUrl = HOST_WHATSAPP
      ? `https://wa.me/${HOST_WHATSAPP}?text=${text}`
      : `https://wa.me/?text=${text}`;
    return { status: 'manual', url: fallbackUrl, message };
  }

  try {
    const url =
      `/api/callmebot/whatsapp.php` +
      `?phone=${encodeURIComponent(HOST_WHATSAPP)}` +
      `&text=${encodeURIComponent(message)}` +
      `&apikey=${encodeURIComponent(CALLMEBOT_API_KEY)}`;
    const res  = await fetch(url);
    const body = await res.text();
    if (!res.ok || body.toLowerCase().includes('error')) throw new Error(body);
    return { status: 'sent' };
  } catch (err) {
    console.error('CallMeBot error:', err);
    const text = encodeURIComponent(message);
    return { status: 'manual', url: `https://wa.me/${HOST_WHATSAPP}?text=${text}`, message };
  }
}
