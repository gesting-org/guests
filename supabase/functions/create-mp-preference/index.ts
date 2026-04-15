// Supabase Edge Function — crea una preferencia de MercadoPago
// Recibe: { amount_ars: number, order_meta: object }
// Devuelve: { preference_id: string }

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { amount_ars, order_meta } = await req.json();

    if (!amount_ars || amount_ars <= 0) {
      return new Response(
        JSON.stringify({ error: 'amount_ars requerido y debe ser > 0' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN') ?? '';
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'MP_ACCESS_TOKEN no configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Construir items para la preferencia
    const items = (order_meta.items ?? []).map((i: any) => ({
      id:          i.productId,
      title:       i.productName,
      quantity:    i.quantity,
      unit_price:  i.unitPriceARS,
      currency_id: 'ARS',
    }));

    const preference = {
      items,
      metadata: {
        booking_code:  order_meta.bookingCode  ?? '',
        guest_name:    order_meta.guestName    ?? '',
        property_name: order_meta.propertyName ?? '',
        checkin_date:  order_meta.checkinDate  ?? '',
        notes:         order_meta.notes        ?? '',
        total_ars:     String(amount_ars),
        items_json:    JSON.stringify(order_meta.items ?? []),
      },
      // MP notificará a la webhook al completarse el pago
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`,
    };

    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preference),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? JSON.stringify(data));

    return new Response(
      JSON.stringify({ preference_id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('create-mp-preference error:', err);
    return new Response(
      JSON.stringify({ error: 'mp_error', detail: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
