import { supabase } from './supabase.js';

function isSupabaseReady() {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

/**
 * Guarda un pedido confirmado en la tabla GuestOrder de Supabase.
 */
export async function saveOrder({ bookingCode, guestName, propertyName, checkinDate, items, notes, totalARS }) {
  if (!isSupabaseReady()) {
    console.warn('saveOrder: Supabase no configurado, pedido no guardado.');
    return;
  }

  const { error } = await supabase
    .from('GuestOrder')
    .insert({
      bookingCode,
      guestName,
      propertyName,
      checkinDate,
      items: items.map(i => ({
        productId:    i.product.id,
        productName:  i.product.name,
        quantity:     i.quantity,
        unitPriceARS: i.product.price,
      })),
      notes:    notes || null,
      totalARS,
    });

  if (error) console.error('saveOrder error:', error);
}
