// ─── Translations ─────────────────────────────────────────────────────────────

const en = {
  // ── CodeEntry ──
  code_title:    'Enter your code',
  code_sub:      'Your host sent you a unique booking code. Enter it below to get started.',
  code_label:    'Booking code',
  code_ph:       'e.g. KR4TGMW2',
  code_invalid:  'Invalid code. Ask your host for it.',
  code_ok:       'Reservation found',
  code_btn:      'Enter my order →',
  code_no_code:  "Don't have a code? Contact your host.",
  code_guest:    'Guest',
  code_property: 'Property',
  code_checkin:  'Check-in',
  code_host:     'Host',
  demo_title:    'Demo reservations',
  demo_note:     'Only visible in demo mode · Do not share with real guests',

  // ── Booking lookup ──
  booking_search_btn:       'Look up reservation →',
  booking_searching:        'Searching…',
  booking_checkin_label:    'Check-in',
  booking_checkout_label:   'Check-out',
  booking_nights_label:     'Nights',
  booking_nights_value:     (n) => `${n} night${n !== 1 ? 's' : ''}`,
  booking_cancelled_label:  'Reservation cancelled',
  booking_cancelled_msg:    'This reservation has been cancelled.',
  booking_cancelled_sub:    'If you think this is a mistake, please contact your host.',
  booking_not_found:        'Code not found. Check it and try again.',
  booking_empty:            'Please enter your booking code.',
  booking_network_error:    'Network error. Check your connection and try again.',
  booking_server_error:     'Server error. Try again in a moment.',
  booking_not_configured:   'The booking system is not configured yet. Contact your host.',

  // ── Hero / Browse ──
  from_host:       'From your host',
  hello:           'Hello,',
  stay_at:         'Your stay at',
  personalized:    'Personalized access activated',
  tagline:         "Order the products you need and they'll be ready when you arrive. No shopping needed.",
  checkin_label:   'Check-in',
  search_ph:       'What do you need? E.g. milk, coffee, rice…',
  search_btn:      'Search',
  searching:       'Searching…',
  loading_msg:     'Searching in Carrefour Argentina…',
  results_found:   (n) => `${n} product${n !== 1 ? 's' : ''} found`,
  no_results:      'No results',
  no_results_desc: 'No food products found for that term. Try "milk", "coffee", "rice"…',
  try_again:       'Try again',
  suggestions:     'Popular suggestions',
  my_order_btn:    'My order',
  confirm_btn:     (n, total) => `Confirm order · USD ${total}`,

  // ── ProductCard ──
  add_btn: 'Add',

  // ── Cart ──
  cart_title:      'My order',
  cart_items:      (n) => `${n} item${n !== 1 ? 's' : ''}`,
  cart_empty:      'Your order is empty',
  cart_empty_desc: 'Search for products and add what you need',
  products_label:  'Products',
  service_label:   (pct) => `Service fee (${pct}%)`,
  total_label:     'Total',
  pay_btn:         'Pay',
  keep_browsing:   'Keep browsing',

  // ── Checkout ──
  your_reservation: 'Your reservation',
  data_from_code:   'Data loaded from your access code',
  guest_label:      'Guest',
  property_label:   'Property',
  checkin_date:     'Check-in',
  host_label:       'Host',
  notes_label:      'Notes',
  notes_optional:   '(optional)',
  notes_ph:         'Estimated arrival time, allergies, preferences…',
  continue_btn:     'Continue to payment →',
  payment_title:    'Payment',
  managed_by:       'Managed by',
  delivery_note:    'Delivery at check-in',
  secure_pay:       'Secure payment · MercadoPago',
  summary_title:    'Summary',
  step_info:        'Details',
  step_pay:         'Payment',

  // ── CheckinBlocked ──
  blocked_today_title:    "Today is your check-in!",
  blocked_today_sub:      (p) => `Your reservation at ${p} starts today. Ordering is now closed.`,
  blocked_tomorrow_title: 'Your reservation is coming up',
  blocked_tomorrow_sub:   (p) => `Your check-in at ${p} is tomorrow. Ordering is no longer available.`,
  blocked_past_title:     'Welcome to your stay!',
  blocked_past_sub:       (p) => `We hope you're enjoying ${p}. The ordering period has closed.`,
  blocked_res_title:      'Your reservation',
  contact_host:           (h) => `Need something? Contact ${h} directly.`,

  // ── Success / Notifications ──
  order_confirmed: 'Order confirmed',
  all_set:         'All set!',
  thank_you:       (name, prop) => `Thank you, ${name}. Your products will be waiting for you at ${prop}.`,
  your_order:      'Your order',
  another_order:   'Place another order',
  notif_sending:   'Notifying your host…',
  notif_sent:      'Host notified via WhatsApp',
  notif_manual:    'Notify host via WhatsApp',
  notif_error:     'Could not notify host. Please inform them manually.',

  // ── Exchange rate ──
  rate_loading: 'Loading rate…',
  rate_updated: (t) => `Updated ${t}`,

  // ── Loading ──
  loading_products: 'Loading host data…',
};

const es = {
  // ── CodeEntry ──
  code_title:    'Ingresá tu código',
  code_sub:      'Tu anfitrión te envió un código único de reserva. Ingresalo para comenzar.',
  code_label:    'Código de reserva',
  code_ph:       'Ej: KR4TGMW2',
  code_invalid:  'Código inválido. Pedíselo a tu anfitrión.',
  code_ok:       'Reserva encontrada',
  code_btn:      'Ingresar a mi pedido →',
  code_no_code:  '¿No tenés código? Contactá a tu anfitrión.',
  code_guest:    'Huésped',
  code_property: 'Propiedad',
  code_checkin:  'Check-in',
  code_host:     'Anfitrión',
  demo_title:    'Reservas de prueba',
  demo_note:     'Solo visibles en modo demo · No compartir con huéspedes reales',

  // ── Booking lookup ──
  booking_search_btn:       'Buscar reserva →',
  booking_searching:        'Buscando…',
  booking_checkin_label:    'Check-in',
  booking_checkout_label:   'Check-out',
  booking_nights_label:     'Noches',
  booking_nights_value:     (n) => `${n} noche${n !== 1 ? 's' : ''}`,
  booking_cancelled_label:  'Reserva cancelada',
  booking_cancelled_msg:    'Esta reserva fue cancelada.',
  booking_cancelled_sub:    'Si creés que es un error, contactá a tu anfitrión.',
  booking_not_found:        'Código no encontrado. Verificalo e intentá de nuevo.',
  booking_empty:            'Ingresá tu código de reserva.',
  booking_network_error:    'Error de red. Verificá tu conexión e intentá de nuevo.',
  booking_server_error:     'Error del servidor. Intentá de nuevo en un momento.',
  booking_not_configured:   'El sistema de reservas aún no está configurado. Contactá a tu anfitrión.',

  // ── Hero / Browse ──
  from_host:       'De parte de',
  hello:           'Hola,',
  stay_at:         'Tu estadía en',
  personalized:    'Acceso personalizado activado',
  tagline:         'Pedí los productos que necesitás y los tendrás listos al llegar. Sin salir a comprar.',
  checkin_label:   'Check-in',
  search_ph:       '¿Qué necesitás? Ej: leche, café, arroz…',
  search_btn:      'Buscar',
  searching:       'Buscando…',
  loading_msg:     'Buscando en Carrefour Argentina…',
  results_found:   (n) => `${n} producto${n !== 1 ? 's' : ''} encontrado${n !== 1 ? 's' : ''}`,
  no_results:      'Sin resultados',
  no_results_desc: 'No encontramos comestibles con ese término. Probá "leche", "café", "arroz"…',
  try_again:       'Intentar de nuevo',
  suggestions:     'Sugerencias populares',
  my_order_btn:    'Mi pedido',
  confirm_btn:     (n, total) => `Confirmar pedido · USD ${total}`,

  // ── ProductCard ──
  add_btn: 'Agregar',

  // ── Cart ──
  cart_title:      'Mi pedido',
  cart_items:      (n) => `${n} ítem${n !== 1 ? 's' : ''}`,
  cart_empty:      'Tu pedido está vacío',
  cart_empty_desc: 'Buscá productos y agregá los que necesitás',
  products_label:  'Productos',
  service_label:   (pct) => `Servicio (${pct}%)`,
  total_label:     'Total',
  pay_btn:         'Pagar',
  keep_browsing:   'Seguir buscando',

  // ── Checkout ──
  your_reservation: 'Tu reserva',
  data_from_code:   'Datos cargados desde tu código de acceso',
  guest_label:      'Huésped',
  property_label:   'Propiedad',
  checkin_date:     'Check-in',
  host_label:       'Anfitrión',
  notes_label:      'Notas',
  notes_optional:   '(opcional)',
  notes_ph:         'Hora estimada de llegada, alergias, preferencias…',
  continue_btn:     'Continuar al pago →',
  payment_title:    'Pago',
  managed_by:       'Gestionado por',
  delivery_note:    'Entrega al check-in',
  secure_pay:       'Pago seguro · MercadoPago',
  summary_title:    'Resumen',
  step_info:        'Datos',
  step_pay:         'Pago',

  // ── CheckinBlocked ──
  blocked_today_title:    '¡Hoy es tu check-in!',
  blocked_today_sub:      (p) => `Tu reserva en ${p} comienza hoy. El período de pedidos está cerrado.`,
  blocked_tomorrow_title: 'Tu reserva es muy próxima',
  blocked_tomorrow_sub:   (p) => `Tu check-in en ${p} es mañana. Ya no es posible hacer nuevos pedidos.`,
  blocked_past_title:     '¡Bienvenido a tu estadía!',
  blocked_past_sub:       (p) => `Esperamos que estés disfrutando ${p}. El período de pedidos ya cerró.`,
  blocked_res_title:      'Tu reserva',
  contact_host:           (h) => `¿Necesitás algo? Contactá a ${h} directamente.`,

  // ── Success / Notifications ──
  order_confirmed: 'Pedido confirmado',
  all_set:         '¡Todo listo!',
  thank_you:       (name, prop) => `Gracias, ${name}. Tus productos estarán esperándote en ${prop}.`,
  your_order:      'Tu pedido',
  another_order:   'Hacer otro pedido',
  notif_sending:   'Notificando al anfitrión…',
  notif_sent:      'Anfitrión notificado por WhatsApp',
  notif_manual:    'Notificar al anfitrión por WhatsApp',
  notif_error:     'No se pudo notificar al anfitrión. Avisale manualmente.',

  // ── Exchange rate ──
  rate_loading: 'Cargando cotización…',
  rate_updated: (t) => `Actualizado ${t}`,

  // ── Loading ──
  loading_products: 'Cargando datos del huésped…',
};

export const translations = { en, es };

/** Devuelve la función de traducción para el idioma dado. */
export function makeT(lang) {
  const dict = translations[lang] ?? translations.en;
  return (key, ...args) => {
    const val = dict[key] ?? translations.en[key] ?? key;
    return typeof val === 'function' ? val(...args) : val;
  };
}
