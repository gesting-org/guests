// Supabase Edge Function — procesa un pago de MercadoPago con cardPayment Brick
// Recibe: { form_data: object, amount_ars: number, order_meta: object }
// Devuelve: { status: string, payment_id: string }

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { form_data, amount_ars, order_meta } = await req.json();

    if (!form_data || !amount_ars) {
      return new Response(
        JSON.stringify({ error: 'form_data y amount_ars son requeridos' }),
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

    // Construir el payload de pago para la API de MP
    // form_data viene del cardPayment Brick: contiene token, installments, issuer_id, etc.
    const paymentPayload = {
      transaction_amount: amount_ars,
      token:              form_data.token,
      description:        `Pedido gestin — ${order_meta.propertyName ?? ''}`,
      installments:       form_data.installments ?? 1,
      payment_method_id:  form_data.payment_method_id,
      issuer_id:          form_data.issuer_id,
      payer: {
        email:             form_data.payer?.email ?? order_meta.guestEmail ?? 'guest@gestin.ar',
        identification:    form_data.payer?.identification,
      },
      metadata: {
        booking_code:  order_meta.bookingCode  ?? '',
        guest_name:    order_meta.guestName    ?? '',
        property_name: order_meta.propertyName ?? '',
        checkin_date:  order_meta.checkinDate  ?? '',
        notes:         order_meta.notes        ?? '',
        total_ars:     String(amount_ars),
        items_json:    JSON.stringify(order_meta.items ?? []),
      },
      // El webhook de MP va a llamar a mp-webhook al aprobarse
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`,
    };

    const res = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify(paymentPayload),
    });

    const payment = await res.json();

    if (!res.ok) {
      console.error('MP payment error:', payment);
      return new Response(
        JSON.stringify({ error: payment.message ?? 'mp_payment_error', detail: payment }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Devolver status al frontend
    return new Response(
      JSON.stringify({
        payment_id: payment.id,
        status:     payment.status,            // approved | pending | rejected
        status_detail: payment.status_detail,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    console.error('process-payment error:', err);
    return new Response(
      JSON.stringify({ error: 'handler_error', detail: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
