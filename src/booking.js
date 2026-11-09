// ─── PMS Booking — consulta directa a Supabase ───────────────────────────────
// Ambos sistemas (PMS y sitio de huéspedes) comparten la misma base de datos
// Supabase, por lo que no se necesita un endpoint HTTP intermedio.

import { supabase } from './supabase.js';

/**
 * Busca una reserva por su código de reserva (bookingCode).
 * Normaliza el código a mayúsculas antes de consultar.
 *
 * @param {string} rawCode
 * @returns {Promise<{ ok: true, data: NormalizedBooking } | { ok: false, error: string }>}
 */
export async function fetchBooking(rawCode) {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: 'empty' };

  try {
    // 1. Buscar la reserva
    // Nombres de tabla en minúscula ("reservations", no "Reservation") y sin
    // columna "nights" — el PMS nuevo (Fabel_PMS) no la guarda, se calcula
    // acá a partir de checkIn/checkOut.
    const { data: res, error: resErr } = await supabase
      .from('reservations')
      .select('id, bookingCode, guestId, propertyId, checkIn, checkOut, checkInTime, checkOutTime, status')
      .eq('bookingCode', code)
      .single();

    if (resErr || !res) return { ok: false, error: 'not_found' };

    // 2. Buscar huésped y propiedad en paralelo
    // El PMS nuevo guarda el nombre del huésped en un solo campo "name" (no
    // firstName/lastName separados).
    const [{ data: guest }, { data: property }] = await Promise.all([
      supabase.from('guests').select('name').eq('id', res.guestId).single(),
      supabase.from('properties').select('name, address, city').eq('id', res.propertyId).single(),
    ]);

    // Reapertura manual de pedidos (la setea el PMS). Consulta aparte y tolerante:
    // si falla, se aplica la regla normal en vez de romper la búsqueda.
    let ordersOpenUntil = null;
    try {
      const { data: win } = await supabase
        .from('reservations')
        .select('ordersOpenUntil')
        .eq('id', res.id)
        .single();
      ordersOpenUntil = win?.ordersOpenUntil ?? null;
    } catch {
      /* sin reapertura */
    }

    const nights =
      res.checkIn && res.checkOut
        ? Math.round((new Date(res.checkOut).getTime() - new Date(res.checkIn).getTime()) / 86_400_000)
        : 0;

    return {
      ok: true,
      data: {
        bookingCode:    res.bookingCode ?? '',
        guestFirstName: guest?.name ?? '',
        checkIn:        res.checkIn  ? res.checkIn.slice(0, 10)  : '',
        checkOut:       res.checkOut ? res.checkOut.slice(0, 10) : '',
        checkInTime:    res.checkInTime  ?? '',
        checkOutTime:   res.checkOutTime ?? '',
        nights,
        status:         res.status  ?? '',
        ordersOpenUntil,
        property: {
          name:    property?.name    ?? '',
          address: property?.address ?? '',
          city:    property?.city    ?? '',
        },
      },
    };
  } catch {
    return { ok: false, error: 'network_error' };
  }
}

/**
 * Mapea el NormalizedBooking al shape interno guestInfo usado en App.jsx,
 * Checkout, CheckinBlocked, etc.
 */
export function bookingToGuestInfo(data) {
  return {
    bookingCode:     data.bookingCode ?? '',
    guestName:       data.guestFirstName,
    checkinDate:     data.checkIn,
    checkoutDate:    data.checkOut,
    checkinTime:     data.checkInTime,
    checkoutTime:    data.checkOutTime,
    nights:          data.nights,
    status:          data.status,
    ordersOpenUntil: data.ordersOpenUntil ?? null,
    propertyName:    data.property.name,
    propertyAddress: data.property.address,
    propertyCity:    data.property.city,
    hostName:        '',
  };
}
