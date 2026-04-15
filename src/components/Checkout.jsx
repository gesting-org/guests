import { useState, useEffect, useRef } from 'react';
import { MARKUP_PERCENTAGE, MERCADOPAGO_PUBLIC_KEY } from '../config.js';
import { Gestin6Logo } from '../App.jsx';

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' fill='%23EFE8DC'%3E%3Crect width='48' height='48' rx='6'/%3E%3C/svg%3E";

// ─── Order summary ────────────────────────────────────────────────────────────
function Summary({ cart, cartTotal, applyMarkup, t, toUSD }) {
  const orig      = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const markup    = cartTotal - orig;
  const totalUSD  = toUSD ? toUSD(cartTotal) : null;
  const origUSD   = toUSD && orig > 0 ? toUSD(orig) : null;
  const markupUSD = toUSD && markup > 0 ? toUSD(markup) : null;

  return (
    <div className="bg-cream-50 rounded-2xl border border-cream-200 p-5">
      <h3 className="font-body font-semibold text-sm text-gray-500 uppercase tracking-wider mb-4">
        {t('summary_title')}
      </h3>
      <div className="space-y-3 mb-4">
        {cart.map((item) => {
          const lineARS = applyMarkup(item.product.price) * item.quantity;
          const lineUSD = toUSD ? toUSD(lineARS) : null;
          return (
            <div key={item.product.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-cream-200 flex-shrink-0">
                <img
                  src={item.product.imageUrl || PLACEHOLDER}
                  onError={(e) => { e.target.src = PLACEHOLDER; }}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-gray-900 leading-tight truncate">
                  {item.product.name}
                </p>
                <p className="font-body text-xs text-gray-400">× {item.quantity}</p>
              </div>
              <span className="font-body text-sm font-semibold text-gray-900 whitespace-nowrap">
                {lineUSD ? `USD ${lineUSD}` : `$${lineARS.toLocaleString('es-AR')}`}
              </span>
            </div>
          );
        })}
      </div>
      <div className="border-t border-cream-200 pt-3 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="font-body text-gray-400">{t('products_label')}</span>
          <span className="font-body text-gray-400 line-through">
            {origUSD ? `USD ${origUSD}` : `$${orig.toLocaleString('es-AR')}`}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="font-body text-gray-400">{t('service_label', MARKUP_PERCENTAGE)}</span>
          <span className="font-body text-gray-400">
            +{markupUSD ? `USD ${markupUSD}` : `$${markup.toLocaleString('es-AR')}`}
          </span>
        </div>
        <div className="flex justify-between pt-2">
          <span className="font-body font-semibold text-gray-900 text-sm">{t('total_label')}</span>
          <span className="font-body font-bold text-terra-300 text-base">
            {totalUSD ? `USD ${totalUSD}` : `$${cartTotal.toLocaleString('es-AR')}`}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── MercadoPago Brick ────────────────────────────────────────────────────────
function MPBrick({ amount, orderMeta, onSuccess, onError, t, toUSD }) {
  const mountedRef = useRef(false);
  const ctrlRef    = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | processing | demo | error

  const isDemo = !MERCADOPAGO_PUBLIC_KEY || MERCADOPAGO_PUBLIC_KEY === '';

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    if (isDemo)              { setStatus('demo'); return; }
    if (!window.MercadoPago) { setStatus('demo'); return; }

    (async () => {
      try {
        // 1. Crear preferencia en la Edge Function
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const res = await fetch(`${supabaseUrl}/functions/v1/create-mp-preference`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount_ars: amount, order_meta: orderMeta }),
        });
        const data = await res.json();
        if (!res.ok || !data.preference_id) throw new Error(data.error ?? 'sin preference_id');

        // 2. Montar el Brick con la preferencia
        const mp      = new window.MercadoPago(MERCADOPAGO_PUBLIC_KEY, { locale: 'es-AR' });
        const bricks  = mp.bricks();
        const ctrl    = await bricks.create('cardPayment', 'mp_brick', {
          initialization: { amount, preferenceId: data.preference_id },
          customization: {
            paymentMethods: { creditCard: 'all', debitCard: 'all' },
            visual: {
              style: {
                theme: 'default',
                customVariables: { baseColor: '#C4704F' },
              },
            },
          },
          callbacks: {
            onReady: () => setStatus('ready'),
            onSubmit: async (formData) => {
              setStatus('processing');
              try {
                // Procesar el pago con el token del Brick via la Edge Function process-payment
                const payRes = await fetch(`${supabaseUrl}/functions/v1/process-payment`, {
                  method:  'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    form_data:  formData,
                    amount_ars: amount,
                    order_meta: orderMeta,
                  }),
                });
                const payData = await payRes.json();
                if (!payRes.ok) throw new Error(payData.error ?? 'payment_error');
                if (payData.status === 'rejected') {
                  throw new Error(`Pago rechazado: ${payData.status_detail}`);
                }
                onSuccess();
              } catch (err) {
                setStatus('ready');
                onError(err);
              }
            },
            onError: (err) => { setStatus('ready'); onError(err); },
          },
        });
        ctrlRef.current = ctrl;
      } catch (err) {
        console.error('MPBrick init error:', err);
        setStatus('demo');
        onError(err);
      }
    })();

    return () => ctrlRef.current?.unmount?.();
  }, [amount]);

  if (status === 'demo') {
    return <DemoPayment amount={amount} onSuccess={onSuccess} t={t} toUSD={toUSD} />;
  }

  return (
    <div className="relative min-h-[200px]">
      {(status === 'loading' || status === 'processing') && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl z-10">
          <svg className="w-7 h-7 text-terra-300 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        </div>
      )}
      <div id="mp_brick" />
    </div>
  );
}

// ─── Demo form (sin keys configuradas) ───────────────────────────────────────
function DemoPayment({ amount, onSuccess, t, toUSD }) {
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const amountUSD = toUSD ? toUSD(amount) : null;

  const formatters = {
    number: (v) => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim(),
    expiry: (v) => { const d = v.replace(/\D/g,'').slice(0,4); return d.length>2?`${d.slice(0,2)}/${d.slice(2)}`:d; },
    cvv:    (v) => v.replace(/\D/g,'').slice(0,4),
    name:   (v) => v.slice(0,60),
  };

  const set = (f) => (e) => setCard((p) => ({ ...p, [f]: formatters[f](e.target.value) }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1600));
    onSuccess();
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-4">
        <span className="tag bg-amber-50 text-amber-600 border border-amber-200">DEMO</span>
        <span className="font-body text-xs text-gray-400">Configurá VITE_MERCADOPAGO_PUBLIC_KEY para pagos reales</span>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">Número de tarjeta</label>
          <input className="input font-mono" placeholder="4111 1111 1111 1111" value={card.number} onChange={set('number')} autoComplete="cc-number"/>
        </div>
        <div>
          <label className="label">Nombre en la tarjeta</label>
          <input className="input" placeholder="NOMBRE APELLIDO" value={card.name} onChange={set('name')} autoComplete="cc-name"/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Vencimiento</label>
            <input className="input font-mono" placeholder="MM/AA" value={card.expiry} onChange={set('expiry')} autoComplete="cc-exp"/>
          </div>
          <div>
            <label className="label">CVV</label>
            <input className="input font-mono" placeholder="•••" type="password" value={card.cvv} onChange={set('cvv')} autoComplete="cc-csc"/>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-secondary w-full py-4 text-base mt-1">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Procesando…
            </span>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              {t('pay_btn')} {amountUSD ? `USD ${amountUSD}` : `$${amount.toLocaleString('es-AR')}`}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// ─── Checkout ─────────────────────────────────────────────────────────────────
export default function Checkout({
  cart, cartTotal, applyMarkup,
  guestInfo,
  activePropertyName, activeCheckinDate, activeCheckinFmt, activeHostName,
  onBack, onSuccess,
  t, toUSD,
}) {
  const [step,  setStep]  = useState('info');
  const [notes, setNotes] = useState('');

  const goToPayment = (e) => {
    e.preventDefault();
    setStep('payment');
  };

  // Metadata completa del pedido — se pasa a la Edge Function y queda en metadata del pago MP
  const orderMeta = {
    bookingCode:  guestInfo.bookingCode,
    guestName:    guestInfo.guestName,
    propertyName: activePropertyName,
    checkinDate:  guestInfo.checkinDate,
    notes,
    items: cart.map(i => ({
      productId:    i.product.id,
      productName:  i.product.name,
      quantity:     i.quantity,
      unitPriceARS: applyMarkup(i.product.price),
    })),
  };

  const handleSuccess = () => {
    onSuccess({
      guestName:    guestInfo.guestName,
      checkinDate:  guestInfo.checkinDate,
      notes,
      items:        cart,
      total:        cartTotal,
      applyMarkup,
      propertyName: activePropertyName,
    });
  };

  const steps = [t('step_info'), t('step_pay')];

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-cream-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={step === 'payment' ? () => setStep('info') : onBack}
            className="w-8 h-8 rounded-xl hover:bg-cream-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <Gestin6Logo size="sm" />
          <div className="ml-auto flex items-center gap-1.5">
            {steps.map((label, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-body transition-all ${
                  (i === 0 && step === 'info') || (i === 1 && step === 'payment')
                    ? 'bg-gray-900 text-white'
                    : i === 0 && step === 'payment'
                    ? 'bg-sage-300 text-white'
                    : 'bg-cream-200 text-gray-400'
                }`}>
                  {i === 0 && step === 'payment' ? '✓' : i + 1}
                </div>
                <span className={`font-body text-xs hidden sm:inline ${
                  (i === 0 && step === 'info') || (i === 1 && step === 'payment')
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-400'
                }`}>
                  {label}
                </span>
                {i === 0 && <div className="w-5 h-px bg-cream-300 hidden sm:block" />}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left */}
          <div className="md:col-span-3 space-y-4">
            {/* Property info */}
            <div className="bg-white rounded-2xl border border-cream-200 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-sage-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9"/>
                </svg>
              </div>
              <div>
                <p className="font-body font-semibold text-sm text-gray-900">{activePropertyName}</p>
                <p className="font-body text-xs text-gray-400">{t('checkin_date')}: {activeCheckinFmt}</p>
              </div>
            </div>

            {/* Step 1: Info */}
            {step === 'info' && (
              <div className="bg-white rounded-2xl border border-cream-200 p-6 animate-fade-in">
                <h2 className="font-display text-xl text-gray-900 mb-1">{t('your_reservation')}</h2>
                <p className="font-body text-xs text-gray-400 mb-5">{t('data_from_code')}</p>

                <form onSubmit={goToPayment} className="space-y-4">
                  <div className="space-y-3 bg-cream-50 rounded-xl p-4 border border-cream-200">
                    {[
                      { icon: '👤', label: t('guest_label'),    value: guestInfo.guestName },
                      { icon: '🏠', label: t('property_label'), value: activePropertyName },
                      { icon: '📅', label: t('checkin_date'),   value: activeCheckinFmt },
                      { icon: '👋', label: t('host_label'),     value: activeHostName },
                    ].map(({ icon, label, value }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-base w-5 text-center flex-shrink-0">{icon}</span>
                        <div className="min-w-0">
                          <p className="font-body text-[10px] text-gray-400 uppercase tracking-wider leading-none mb-0.5">{label}</p>
                          <p className="font-body text-sm font-semibold text-gray-900 truncate">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="label" htmlFor="notes">
                      {t('notes_label')} <span className="normal-case text-gray-400 font-normal">{t('notes_optional')}</span>
                    </label>
                    <textarea
                      id="notes"
                      className="input resize-none"
                      placeholder={t('notes_ph')}
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <button type="submit" className="btn-secondary w-full py-4 text-base">
                    {t('continue_btn')}
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 'payment' && (
              <div className="bg-white rounded-2xl border border-cream-200 p-6 animate-fade-in">
                <h2 className="font-display text-xl text-gray-900 mb-1">{t('payment_title')}</h2>
                <p className="font-body text-sm text-gray-400 mb-5">
                  {t('managed_by')} {activeHostName} · {t('delivery_note')}
                </p>
                <MPBrick
                  amount={cartTotal}
                  orderMeta={orderMeta}
                  onSuccess={handleSuccess}
                  onError={(e) => console.error('Payment error:', e)}
                  t={t}
                  toUSD={toUSD}
                />
                <p className="font-body text-xs text-center text-gray-300 mt-4 flex items-center justify-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  {t('secure_pay')}
                </p>
              </div>
            )}
          </div>

          {/* Right: Summary */}
          <div className="md:col-span-2">
            <Summary cart={cart} cartTotal={cartTotal} applyMarkup={applyMarkup} t={t} toUSD={toUSD} />
          </div>
        </div>
      </main>
    </div>
  );
}
