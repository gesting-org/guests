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
    const { data: res, error: resErr } = await supabase
      .from('Reservation')
      .select('id, bookingCode, guestId, propertyId, checkIn, checkOut, checkInTime, checkOutTime, nights, status')
      .eq('bookingCode', code)
      .single();

    if (resErr || !res) return { ok: false, error: 'not_found' };

    // 2. Buscar huésped y propiedad en paralelo
    const [{ data: guest }, { data: property }] = await Promise.all([
      supabase.from('Guest').select('firstName, lastName').eq('id', res.guestId).single(),
      supabase.from('Property').select('name, address, city').eq('id', res.propertyId).single(),
    ]);

    return {
      ok: true,
      data: {
        bookingCode:    res.bookingCode ?? '',
        guestFirstName: guest?.firstName ?? '',
        checkIn:        res.checkIn  ? res.checkIn.slice(0, 10)  : '',
        checkOut:       res.checkOut ? res.checkOut.slice(0, 10) : '',
        checkInTime:    res.checkInTime  ?? '',
        checkOutTime:   res.checkOutTime ?? '',
        nights:         res.nights  ?? 0,
        status:         res.status  ?? '',
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
    propertyName:    data.property.name,
    propertyAddress: data.property.address,
    propertyCity:    data.property.city,
    hostName:        '',
  };
}
