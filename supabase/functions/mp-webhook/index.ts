// Supabase Edge Function — webhook de MercadoPago
// MP llama aquí cuando un pago cambia de estado.
// Al recibir payment.updated con status "approved", guarda en GuestOrder y notifica al host.

import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')             ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

Deno.serve(async (req) => {
  try {
    const body = await req.json();

    // MP envía { type: "payment", action: "payment.updated", data: { id: "..." } }
    if (body.type !== 'payment') {
      return new Response('ignored', { status: 200 });
    }

    const paymentId  = body.data?.id;
    const accessToken = Deno.env.get('MP_ACCESS_TOKEN') ?? '';

    // Obtener detalle del pago
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const payment = await res.json();

    if (payment.status !== 'approved') {
      return new Response('not_approved', { status: 200 });
    }

    const meta = payment.metadata ?? {};

    // Guardar pedido en GuestOrder
    const items = JSON.parse(meta.items_json ?? '[]');
    const { error } = await supabase.from('GuestOrder').insert({
      bookingCode:  meta.booking_code  ?? '',
      guestName:    meta.guest_name    ?? '',
      propertyName: meta.property_name ?? '',
      checkinDate:  meta.checkin_date  ?? null,
      items,
      notes:        meta.notes || null,
      totalARS:     parseFloat(meta.total_ars ?? '0'),
    });

    if (error) {
      console.error('Error guardando GuestOrder:', error);
      return new Response('db_error', { status: 500 });
    }

    // Notificar al host por WhatsApp
    const hostWhatsapp = Deno.env.get('HOST_WHATSAPP')     ?? '';
    const callmebotKey = Deno.env.get('CALLMEBOT_API_KEY') ?? '';
    if (hostWhatsapp && callmebotKey) {
      const message = buildMessage(meta, items);
      const url =
        `https://api.callmebot.com/whatsapp.php` +
        `?phone=${encodeURIComponent(hostWhatsapp)}` +
        `&text=${encodeURIComponent(message)}` +
        `&apikey=${encodeURIComponent(callmebotKey)}`;
      await fetch(url).catch((e) => console.error('CallMeBot error:', e));
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('mp-webhook error:', err);
    return new Response('handler_error', { status: 500 });
  }
});

function buildMessage(meta: Record<string, string>, items: any[]): string {
  const fmt   = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');
  const lines = items.map(
    (i: any) => `• ${i.productName} ×${i.quantity} — ${fmt(i.unitPriceARS * i.quantity)}`,
  );
  return [
    '💳 *Pago confirmado — gestin*',
    '',
    `👤 Huésped: *${meta.guest_name}*`,
    `🏠 Propiedad: ${meta.property_name}`,
    `📅 Check-in: ${meta.checkin_date}`,
    '',
    '*Productos:*',
    ...lines,
    '',
    `💰 *Total: ${fmt(parseFloat(meta.total_ars ?? '0'))}*`,
    meta.notes ? `💬 Nota: "${meta.notes}"` : '',
  ].filter(Boolean).join('\n').trim();
}
