import { useState, useCallback, useEffect, useMemo } from 'react';
import SearchBar      from './components/SearchBar.jsx';
import ProductCard    from './components/ProductCard.jsx';
import Cart           from './components/Cart.jsx';
import Checkout       from './components/Checkout.jsx';
import PackSection    from './components/PackSection.jsx';
import CodeEntry      from './components/CodeEntry.jsx';
import CheckinBlocked, { daysUntilCheckin } from './components/CheckinBlocked.jsx';
import { notifyHost } from './notify.js';
import { LangProvider, useLang } from './LangContext.jsx';
import { useExchangeRate } from './useExchangeRate.js';
import {
  MARKUP_PERCENTAGE,
  formatDate,
} from './config.js';
import { fetchBooking, bookingToGuestInfo } from './booking.js';
import { saveOrder } from './db.js';

// ─── Logo gestin ──────────────────────────────────────────────────────────────
// variant="full" → logo-full.png  (logotipo completo)
// variant="icon" → logo-icon.png  (solo el isotipo)
// Fallback SVG si los PNGs no están en /public todavía.
export function Gestin6Logo({ size = 'md', variant = 'full' }) {
  const [err, setErr] = useState(false);
  const heights = { sm: 24, md: 32, lg: 44 };
  const h = heights[size] ?? heights.md;
  const src = variant === 'icon' ? '/logo-icon.png' : '/logo-full.png';

  if (!err) {
    return (
      <img
        src={src}
        alt="gestin"
        style={{ height: h, width: 'auto' }}
        className="object-contain"
        onError={() => setErr(true)}
      />
    );
  }

  // Fallback SVG mientras no haya PNGs en /public
  return (
    <svg viewBox="0 0 148 36" height={h} fill="none" aria-label="gestin">
      <text x="0" y="27" fontFamily='"Plus Jakarta Sans",sans-serif'
            fontWeight="300" fontSize="28" letterSpacing="-0.5" fill="currentColor">
        gestin
      </text>
      <rect x="117" y="13" width="22" height="17" rx="4" fill="currentColor"/>
      <path d="M121 13V9.5C121 6.462 123.462 4 126.5 4s5.5 2.462 5.5 5.5V13"
            stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
      <circle cx="128" cy="21.5" r="3" fill="white"/>
      <rect x="126.5" y="23.5" width="3" height="3.5" rx="0.8" fill="white"/>
    </svg>
  );
}

// ─── Language toggle ───────────────────────────────────────────────────────────
function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-cream-200
                 hover:bg-cream-100 transition-colors duration-150 font-body text-xs font-semibold text-gray-500"
      title={lang === 'en' ? 'Cambiar a español' : 'Switch to English'}
    >
      <span className="text-[13px]">{lang === 'en' ? '🇬🇧' : '🇦🇷'}</span>
      <span>{lang === 'en' ? 'EN' : 'ES'}</span>
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-cream-200">
      <div className="h-48 bg-cream-200 animate-skeleton" />
      <div className="p-4 space-y-2.5">
        <div className="h-4 bg-cream-200 animate-skeleton rounded w-3/4" />
        <div className="h-3 bg-cream-200 animate-skeleton rounded w-full" />
        <div className="h-3 bg-cream-200 animate-skeleton rounded w-1/2" />
        <div className="flex justify-between pt-2">
          <div className="h-5 bg-cream-200 animate-skeleton rounded w-1/4" />
          <div className="h-9 bg-cream-200 animate-skeleton rounded-xl w-28" />
        </div>
      </div>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessView({ orderInfo, notifResult, onReset, t, toUSD }) {
  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-panel p-8 md:p-12 max-w-md w-full text-center animate-slide-up">
        {/* Check */}
        <div className="w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-sage-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <p className="font-body text-xs font-semibold text-sage-500 uppercase tracking-widest mb-2">
          {t('order_confirmed')}
        </p>
        <h2 className="font-display text-3xl text-gray-900 mb-3">{t('all_set')}</h2>
        <p className="font-body text-gray-500 text-sm mb-6">
          {t('thank_you', orderInfo?.guestName, orderInfo?.propertyName)}
        </p>

        {/* WhatsApp notification status */}
        <NotifStatus result={notifResult} t={t} />

        {/* Order summary */}
        <div className="bg-cream-100 rounded-2xl p-5 mb-6 text-left">
          <p className="label mb-3">{t('your_order')}</p>
          <div className="space-y-2">
            {orderInfo?.items.map((item) => {
              const markedUpARS = orderInfo.applyMarkup(item.product.price) * item.quantity;
              const usd = toUSD ? toUSD(markedUpARS) : null;
              return (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-gray-700 truncate pr-2">
                    {item.product.name}
                    <span className="text-gray-400 ml-1">× {item.quantity}</span>
                  </span>
                  <span className="font-semibold text-gray-900 whitespace-nowrap">
                    {usd ? `USD ${usd}` : `$${markedUpARS.toLocaleString('es-AR')}`}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-cream-200 mt-3 pt-3 flex justify-between font-semibold">
            <span className="font-body">{t('total_label')}</span>
            <span className="font-body text-terra-300 text-lg">
              {toUSD && orderInfo?.total
                ? `USD ${toUSD(orderInfo.total)}`
                : `$${orderInfo?.total.toLocaleString('es-AR')}`}
            </span>
          </div>
        </div>

        {orderInfo?.notes && (
          <p className="font-body text-sm text-gray-400 italic mb-6">"{orderInfo.notes}"</p>
        )}

        <button onClick={onReset} className="btn-secondary w-full">
          {t('another_order')}
        </button>
      </div>
    </div>
  );
}

// ─── WhatsApp notification status ─────────────────────────────────────────────
function NotifStatus({ result, t }) {
  if (!result) {
    return (
      <div className="flex items-center justify-center gap-2 bg-cream-100 rounded-xl px-4 py-3 mb-5 text-sm">
        <svg className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        <span className="font-body text-gray-400">{t('notif_sending')}</span>
      </div>
    );
  }

  if (result.status === 'sent') {
    return (
      <div className="flex items-center justify-center gap-2 bg-[#dcf8c6] rounded-xl px-4 py-3 mb-5">
        <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 fill-[#25D366]">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M11.998 2C6.477 2 2 6.477 2 12c0 1.99.586 3.842 1.595 5.385L2 22l4.759-1.568A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.521 2 11.998 2zm.002 18a8 8 0 01-4.077-1.116l-.292-.174-3.017.993.999-2.957-.19-.304A8 8 0 1112 20z"/>
        </svg>
        <span className="font-body text-sm font-medium text-[#128C7E]">
          {t('notif_sent')}
        </span>
      </div>
    );
  }

  if (result.status === 'manual') {
    return (
      <a
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20b857] active:scale-[0.98]
                   text-white rounded-xl px-4 py-3 mb-5 transition-all duration-150 w-full"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M11.998 2C6.477 2 2 6.477 2 12c0 1.99.586 3.842 1.595 5.385L2 22l4.759-1.568A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.521 2 11.998 2zm.002 18a8 8 0 01-4.077-1.116l-.292-.174-3.017.993.999-2.957-.19-.304A8 8 0 1112 20z"/>
        </svg>
        <span className="font-body text-sm font-semibold">
          {t('notif_manual')}
        </span>
      </a>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
      <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/>
      </svg>
      <span className="font-body text-xs text-red-500">
        {t('notif_error')}
      </span>
    </div>
  );
}

// ─── Module-level constants (defined once, never recreated) ───────────────────

// EN→ES translation map for Carrefour's Spanish-only catalog.
// Entries: [spanish_term, ...english_variants]
// Multi-word terms are supported: 'papas fritas' matches 'chips' or 'crisps'.
const EN_TO_ES_MAP = new Map([
  ['leche',          ['milk','milch','mlk']],
  ['cafe',           ['coffee','coffe','cofee','caffe','café']],
  ['yogur',          ['yogurt','yoghurt','yogourt','yougurt']],
  ['arroz',          ['rice']],
  ['pan',            ['bread','bred']],
  ['jugo',           ['juice','jucie']],
  ['queso',          ['cheese','chese','chees']],
  ['manteca',        ['butter']],
  ['huevo',          ['egg','eggs']],
  ['azucar',         ['sugar']],
  ['sal',            ['salt']],
  ['aceite',         ['oil','olive oil','olive']],
  ['harina',         ['flour']],
  ['fideos',         ['pasta','noodles','noodle']],
  ['agua',           ['water']],
  ['cerveza',        ['beer']],
  ['vino',           ['wine']],
  ['gaseosa',        ['soda','cola']],
  ['galletitas',     ['cookies','cookie','biscuits','biscuit']],
  ['chocolate',      ['chocolate','choco']],
  ['miel',           ['honey']],
  ['mermelada',      ['jam','jelly']],
  ['te',             ['tea']],
  ['cereal',         ['cereal','cereals']],
  ['avena',          ['oats','oat']],
  ['atun',           ['tuna']],
  ['pollo',          ['chicken']],
  ['carne',          ['meat','beef']],
  ['jamon',          ['ham']],
  ['tomate',         ['tomato','tomatoes']],
  ['papa',           ['potato','potatoes']],
  ['cebolla',        ['onion','onions']],
  ['ajo',            ['garlic']],
  ['manzana',        ['apple','apples']],
  ['banana',         ['banana','bananas']],
  ['naranja',        ['orange','oranges']],
  ['limon',          ['lemon','lemons']],
  ['mayonesa',       ['mayonnaise','mayo']],
  ['mostaza',        ['mustard']],
  ['vinagre',        ['vinegar']],
  ['pimienta',       ['pepper']],
  ['mani',           ['peanut','peanuts']],
  ['caramelo',       ['candy','candies','sweets']],
  ['papas fritas',   ['chips','crisps']],
  ['nueces',         ['nuts','nut','walnut']],
  ['yerba',          ['yerba','mate']],
  ['dulce de leche', ['dulce de leche']],
]);

// Build reverse lookup: english_variant → spanish_term (handles multi-word)
const EN_TO_ES_REVERSE = new Map();
for (const [es, variants] of EN_TO_ES_MAP) {
  for (const v of variants) EN_TO_ES_REVERSE.set(v.toLowerCase(), es);
}

/**
 * Translate a single search term from English to Spanish.
 * Tries full string first, then falls back to original.
 */
function translateTerm(raw) {
  const lower = raw.trim().toLowerCase();
  return EN_TO_ES_REVERSE.get(lower) ?? raw.trim();
}

/**
 * Split a query string into individual search terms (space-separated),
 * translate each from EN→ES, and deduplicate.
 * e.g. "manzana naranja banana" → ['manzana','naranja','banana']
 * e.g. "apple juice" → ['manzana','jugo']  (each word translated independently)
 */
function parseQueryTerms(rawQuery) {
  const raw = rawQuery.trim();
  if (!raw) return [];
  const terms = raw.split(/\s+/).map(translateTerm).filter(Boolean);
  return [...new Set(terms)];
}

// ── Food allow/block lists ────────────────────────────────────────────────────
// These check product *categories* (not names) for the global food gate.

const FOOD_CAT_KEYWORDS = new Set([
  'almacén','almacen','alimento','comida','food','grocery',
  'bebida','agua','gaseosa','jugo','vino','cerveza','sidra','soda',
  'espirituosa','whisky','vodka','gin','fernet','aperitivo','licor','champagne','espumante',
  'lácteo','lacteo','leche','yogur','queso','manteca','crema','ricota','dulce de leche',
  'carne','aves','pollo','pescado','mariscos','fiambre','embutido','salchicha','chorizo','hamburguesa',
  'panadería','panaderia','pan','facturas','repostería','reposteria','galleta','bizcocho','tostada','budín',
  'fruta','verdura','vegetal','hortaliza','tuberculo','greengrocery',
  'congelado','frozen',
  'cereal','granola','avena','arroz','fideos','pasta','harina','legumbre',
  'lentejas','garbanzo','porotos',
  'aceite','vinagre','condimento','salsa','ketchup','mayonesa','mostaza',
  'conserva','enlatado','pickles',
  'azúcar','azucar','sal','especias','pimienta','edulcorante','stevia',
  'chocolate','golosina','caramelo','dulce','mermelada','miel','snack',
  'maní','nuez','fruto seco','pochoclo',
  'café','cafe','té','yerba','mate','cacao','infusión','infusion','capsula',
  'desayuno','dietética','dietetica','organico','orgánico',
]);

const BLOCKED_CAT_KEYWORDS = new Set([
  'electrodoméstico','electrodomestico','electrónica','electronica',
  'tecnología','tecnologia','celular','computadora','tablet','televisor',
  'heladera','lavarropas','microondas',
  'mueble','colchon','colchón','hogar','decoración','decoracion',
  'juguete','juego','deporte','bicicleta','camping',
  'ropa','calzado','indumentaria','textil',
  'ferretería','ferreteria','herramienta',
  'limpieza','detergente','lavandina','desinfectante','jabón para ropa','suavizante',
  'higiene','perfumería','perfumeria','desodorante','shampoo','champú',
  'maquillaje','cosmético',
  'mascota','petfood',
  'farmacia','medicamento','vitamina','suplemento',
  'automotor','jardín','jardin','piscina',
  'librería','libreria','papelería','papeleria','oficina',
]);

// Block list checked against the product *name* (petfood and similar)
const PETFOOD_NAME_BLOCK = [
  'mascota','petfood','alimento para','comida para','comida pet',
  'pet food','gatitos','perritos',
  // individual pet keywords only when clearly pet-related (not standalone)
  'para gato','para perro','para pájaro','para pajaro',
];

/**
 * Returns true if the raw VTEX product item passes all filters.
 *
 * @param {object}       item      - Raw VTEX product object
 * @param {string[]|null} catFilter - At least one of these strings must appear in the
 *                                    product's VTEX category paths (joined, lowercased).
 *                                    Uses the real taxonomy — unambiguous, no name hacks.
 * @param {string[]|null} nameBlock - Product name must NOT contain any of these.
 */
function isAllowedProduct(item, catFilter, nameBlock) {
  const cats = (item.categories ?? []).join(' ').toLowerCase();
  const name = (item.productName ?? '').toLowerCase();

  // 1. Hard block: petfood by name or category
  if (PETFOOD_NAME_BLOCK.some(k => name.includes(k) || cats.includes(k))) return false;

  // 2. Hard block: non-food categories
  for (const k of BLOCKED_CAT_KEYWORDS) {
    if (cats.includes(k)) return false;
  }

  // 3. Must be a food category (global gate)
  let isFood = false;
  for (const k of FOOD_CAT_KEYWORDS) {
    if (cats.includes(k)) { isFood = true; break; }
  }
  if (!isFood) return false;

  // 4. Category-specific filter: product must belong to one of the given VTEX paths.
  //    This is exact — "Vinagre de manzana" is in /Almacén/Aceites y vinagres/,
  //    not in /Frutas y verduras/Frutas/, so it's cleanly excluded.
  if (catFilter && !catFilter.some(k => cats.includes(k))) return false;

  // 5. Optional name blocklist (secondary safety net for edge cases)
  if (nameBlock && nameBlock.some(k => name.includes(k))) return false;

  return true;
}

/**
 * Normalize a raw VTEX item into the internal Product shape.
 * Uses productId as stable id so cart state survives re-renders and re-searches.
 */
function normalizeVtexItem(item) {
  const offer  = item.items?.[0]?.sellers?.[0]?.commertialOffer ?? {};
  const rawImg = item.items?.[0]?.images?.[0]?.imageUrl ?? '';
  return {
    id:          item.productId,                       // stable, from VTEX
    name:        item.productName ?? item.items?.[0]?.nameComplete ?? 'Producto',
    price:       offer.Price ?? 0,
    imageUrl:    rawImg ? rawImg.replace(/\/arquivos\/ids\/(\d+).*/, '/arquivos/ids/$1-400-400') : '',
    description: (item.metaTagDescription ?? item.description ?? '')
                   .replace(/<[^>]+>/g, '').trim().slice(0, 120),
  };
}

// ── Category definitions ──────────────────────────────────────────────────────
// Each category has:
//   id         - unique key
//   label      - display name per lang
//   icon       - SVG element
//   terms      - search terms sent to the VTEX ft= API (space-separated)
//   catFilter  - product's VTEX category path must contain at least one of these
//                strings (checked on the joined categories array, lowercased).
//                This is the primary filter — it matches the actual VTEX taxonomy.
//                e.g. "/Frutas y verduras/Frutas/" matches 'frutas y verduras/frutas'
//   nameBlock  - product name must NOT contain any of these (secondary safety net)

const CATEGORIES = [
  {
    id: 'all',
    label: { es: 'Todo', en: 'All' },
    terms: null, catFilter: null, nameBlock: null,
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    id: 'lacteos',
    label: { es: 'Lácteos', en: 'Dairy' },
    terms: 'leche yogur queso manteca crema',
    catFilter: ['lácteos y productos frescos','lacteos y productos frescos'],
    nameBlock: null,
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6l1 5H8L9 3zM8 8v13h8V8M3 8h18"/></svg>,
  },
  {
    id: 'panaderia',
    label: { es: 'Panadería', en: 'Bakery' },
    terms: 'pan galletitas tostadas facturas',
    catFilter: ['panadería','panaderia'],
    nameBlock: null,
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 3a1 1 0 00-1-1H4a1 1 0 00-1 1v2a5 5 0 004 4.9V21h10v-11.1A5 5 0 0021 5V3z"/></svg>,
  },
  {
    id: 'despensa',
    label: { es: 'Despensa', en: 'Pantry' },
    terms: 'arroz fideos harina azucar sal lentejas',
    catFilter: [
      'almacén/arroz y legumbres','almacen/arroz y legumbres',
      'almacén/harinas','almacen/harinas',
      'almacén/sal, aderezos','almacen/sal, aderezos',
      'desayuno y merienda/azúcar','desayuno y merienda/azucar',
    ],
    nameBlock: null,
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm0 5h14M9 3v18"/></svg>,
  },
  {
    id: 'frutas',
    label: { es: 'Frutas', en: 'Fruits' },
    terms: 'manzana naranja banana pera uva frutilla durazno',
    catFilter: ['frutas y verduras/frutas'],
    nameBlock: null,
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z"/></svg>,
  },
  {
    id: 'verduras',
    label: { es: 'Verduras', en: 'Vegetables' },
    terms: 'tomate lechuga papa zanahoria cebolla zapallo',
    catFilter: ['frutas y verduras/verduras'],
    nameBlock: null,
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6 2 3 7 3 12c0 3 1.5 5 3 6.5M12 2c6 0 9 5 9 10 0 3-1.5 5-3 6.5M12 2v20"/></svg>,
  },
  {
    id: 'bebidas',
    label: { es: 'Bebidas', en: 'Drinks' },
    terms: 'agua jugo gaseosa cerveza vino soda',
    catFilter: ['bebidas/'],
    nameBlock: null,
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 3h8l1 9H7L8 3zM7 12c0 5 2 8 5 9 3-1 5-4 5-9"/></svg>,
  },
  {
    id: 'snacks',
    label: { es: 'Snacks', en: 'Snacks' },
    terms: 'alfajor chocolate mani pochoclo',
    catFilter: [
      'desayuno y merienda/golosinas','desayuno y merienda/galletitas',
      'desayuno y merienda/snacks','desayuno y merienda/chocolates',
      'almacén/galletitas','almacen/galletitas',
      'almacén/golosinas','almacen/golosinas',
    ],
    nameBlock: null,
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6l3-3 3 3M12 3v9"/></svg>,
  },
  {
    id: 'carnes',
    label: { es: 'Carnes', en: 'Meats' },
    terms: 'pollo carne milanesa hamburguesa chorizo',
    catFilter: ['carnes y pescados/'],
    nameBlock: null,
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.5 5.5a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5zM3 19l4-4"/></svg>,
  },
  {
    id: 'congelados',
    label: { es: 'Congelados', en: 'Frozen' },
    terms: 'pizza empanada nugget croqueta',
    catFilter: ['congelados/'],
    nameBlock: null,
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/></svg>,
  },
  {
    id: 'infusiones',
    label: { es: 'Infusiones', en: 'Infusions' },
    terms: 'yerba mate cafe te cacao',
    catFilter: ['desayuno y merienda/café','desayuno y merienda/cafe','desayuno y merienda/yerba','desayuno y merienda/infusiones','desayuno y merienda/cacao'],
    nameBlock: ['caramelo','alfajor','golosina'],
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8h1a4 4 0 010 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z"/></svg>,
  },
  {
    id: 'condimentos',
    label: { es: 'Condimentos', en: 'Condiments' },
    terms: 'mayonesa ketchup mostaza vinagre aceite',
    catFilter: ['almacén/sal, aderezos','almacen/sal, aderezos','almacén/aceites y vinagres','almacen/aceites y vinagres'],
    nameBlock: null,
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6v4l2 3v9a1 1 0 01-1 1H8a1 1 0 01-1-1v-9l2-3V3z"/></svg>,
  },
];

// Map for O(1) category lookup by id
const CATEGORY_MAP = new Map(CATEGORIES.map(c => [c.id, c]));

// ─── Inner App (needs LangProvider context) ───────────────────────────────────
function AppInner() {
  const { lang, t } = useLang();
  const { rate, loading: rateLoading, lastUpdated, toUSD } = useExchangeRate();

  // ── Guest data ────────────────────────────────────────────────────────────
  const [guestInfo, setGuestInfo] = useState(null);

  // ── Navigation ────────────────────────────────────────────────────────────
  const [view,        setView]        = useState('browse');
  const [orderInfo,   setOrderInfo]   = useState(null);
  const [notifResult, setNotifResult] = useState(null);

  // ── Search state (single object → always in sync) ────────────────────────
  // status: 'idle' | 'loading' | 'done' | 'error'
  const [search, setSearch] = useState({ status: 'idle', products: [], error: null });

  // ── Active category id — single source of truth for sidebar highlight ────
  // null means "no category selected / showing packs"
  // 'all' means user clicked "All" (same as null but explicitly chosen)
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  // ── Cart ──────────────────────────────────────────────────────────────────
  const [cart,       setCart]       = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // ── Derived guest info ────────────────────────────────────────────────────
  const activeHostName     = guestInfo?.hostName     ?? '';
  const activePropertyName = guestInfo?.propertyName ?? '';
  const activeCheckinDate  = guestInfo?.checkinDate  ?? '';
  const activeCheckinFmt   = activeCheckinDate ? formatDate(activeCheckinDate) : '';

  // ── Read URL code on mount ────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('g');
    if (!code) return;

    fetchBooking(code).then(res => {
      if (res.ok) setGuestInfo(bookingToGuestInfo(res.data));
    });
  }, []);

  // ── Markup ────────────────────────────────────────────────────────────────
  const applyMarkup = useCallback(
    (price) => Math.ceil(price * (1 + MARKUP_PERCENTAGE / 100)),
    []
  );

  // ── Cart derived values (memoized — only recompute when cart changes) ─────
  const cartMap = useMemo(() => {
    const m = new Map();
    for (const item of cart) m.set(item.product.id, item.quantity);
    return m;
  }, [cart]);

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const cartTotal = useMemo(
    () => cart.reduce((s, i) => s + applyMarkup(i.product.price) * i.quantity, 0),
    [cart, applyMarkup]
  );

  // Stable O(1) qty lookup — stable reference between renders
  const getQty = useCallback((id) => cartMap.get(id) ?? 0, [cartMap]);

  // ── Exchange rate label ───────────────────────────────────────────────────
  const rateLabel = rateLoading
    ? t('rate_loading')
    : rate
    ? `USD 1 = $${rate.toLocaleString('es-AR')} · ${
        lastUpdated
          ? t('rate_updated', lastUpdated.toLocaleTimeString(
              lang === 'es' ? 'es-AR' : 'en-US',
              { hour: '2-digit', minute: '2-digit' }
            ))
          : ''
      }`
    : null;

  // ── Core fetch + filter pipeline ──────────────────────────────────────────
  /**
   * Fetch products from the VTEX API and filter them.
   *
   * @param {string}       termsString  Space-separated search terms
   * @param {string[]|null} catFilter   VTEX category path must contain at least one
   * @param {string[]|null} nameBlock   Product name must not contain any of these
   */
  const fetchAndFilter = useCallback(async (termsString, catFilter, nameBlock) => {
    const terms = parseQueryTerms(termsString);
    if (terms.length === 0) return [];

    const PAGE_SIZE = 50;
    // Category searches: catFilter narrows results, so 2 pages per term is enough.
    // Free-text (no catFilter): fetch 3 pages for better coverage.
    const PAGES_PER_TERM = catFilter ? 2 : 3;

    const fetchPromises = terms.flatMap(term =>
      Array.from({ length: PAGES_PER_TERM }, (_, page) => {
        const from = page * PAGE_SIZE;
        const to   = from + PAGE_SIZE - 1;
        const url  = `/api/carrefour/api/catalog_system/pub/products/search`
          + `?ft=${encodeURIComponent(term)}&_from=${from}&_to=${to}&O=OrderByScoreDESC`;
        return fetch(url, { headers: { Accept: 'application/json' } })
          .then(res => res.ok ? res.json() : [])
          .catch(() => []);
      })
    );

    const pages = await Promise.all(fetchPromises);
    const allRaw = pages.flat();

    // Deduplicate by productId (stable VTEX id)
    const seen = new Set();
    const deduped = allRaw.filter(item => {
      if (!item.productId || seen.has(item.productId)) return false;
      seen.add(item.productId);
      return true;
    });

    return deduped
      .filter(item => isAllowedProduct(item, catFilter, nameBlock))
      .map(normalizeVtexItem);
  }, []);

  // ── Category search ───────────────────────────────────────────────────────
  /**
   * Called when the user clicks a sidebar category button.
   * Sets activeCategoryId and triggers the appropriate search.
   */
  const selectCategory = useCallback(async (categoryId) => {
    const cat = CATEGORY_MAP.get(categoryId);
    if (!cat) return;

    // "All" / no terms → back to home (packs view)
    if (!cat.terms) {
      setActiveCategoryId(null);
      setSearch({ status: 'idle', products: [], error: null });
      return;
    }

    setActiveCategoryId(categoryId);
    setSearch({ status: 'loading', products: [], error: null });

    try {
      const products = await fetchAndFilter(cat.terms, cat.catFilter, cat.nameBlock);
      if (products.length === 0) throw new Error(t('no_results_desc'));
      setSearch({ status: 'done', products, error: null });
    } catch (err) {
      setSearch({ status: 'error', products: [], error: err.message || t('no_results_desc') });
    }
  }, [fetchAndFilter, t]);

  // ── Free-text search ──────────────────────────────────────────────────────
  /**
   * Called from the SearchBar. Clears active category (free-text overrides category).
   */
  const searchProducts = useCallback(async (rawQuery) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;

    // Free-text search: clear category selection
    setActiveCategoryId(null);
    setSearch({ status: 'loading', products: [], error: null });

    try {
      // No nameFilter/nameBlock for free-text — only global food gate applies
      const products = await fetchAndFilter(trimmed, null, null);
      if (products.length === 0) throw new Error(t('no_results_desc'));
      setSearch({ status: 'done', products, error: null });
    } catch (err) {
      setSearch({ status: 'error', products: [], error: err.message || t('no_results_desc') });
    }
  }, [fetchAndFilter, t]);

  // ── Reset to home ─────────────────────────────────────────────────────────
  const resetToHome = useCallback(() => {
    setActiveCategoryId(null);
    setSearch({ status: 'idle', products: [], error: null });
  }, []);

  // ── Cart ops ──────────────────────────────────────────────────────────────
  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      return existing
        ? prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((productId, qty) => {
    setCart(prev =>
      qty <= 0
        ? prev.filter(i => i.product.id !== productId)
        : prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i)
    );
  }, []);

  // ── Derived UI state ──────────────────────────────────────────────────────
  const isLoading   = search.status === 'loading';
  const hasResults  = search.status === 'done' && search.products.length > 0;
  const hasError    = search.status === 'error';
  const showPacks   = search.status === 'idle';   // only on home, before any search

  // ─────────────────────────────────────────────────────────────────────────
  // Early-exit views (no hooks below this point)
  // ─────────────────────────────────────────────────────────────────────────

  if (!guestInfo) return <CodeEntry onValidCode={setGuestInfo} t={t} />;
  if (daysUntilCheckin(activeCheckinDate) <= 1) return <CheckinBlocked guestInfo={guestInfo} t={t} />;

  if (view === 'success') {
    return (
      <SuccessView
        orderInfo={orderInfo}
        notifResult={notifResult}
        onReset={() => { setCart([]); setView('browse'); setNotifResult(null); }}
        t={t}
        toUSD={toUSD}
      />
    );
  }

  if (view === 'checkout') {
    return (
      <Checkout
        cart={cart}
        cartTotal={cartTotal}
        applyMarkup={applyMarkup}
        guestInfo={guestInfo}
        activePropertyName={activePropertyName}
        activeCheckinDate={activeCheckinDate}
        activeCheckinFmt={activeCheckinFmt}
        activeHostName={activeHostName}
        onBack={() => setView('browse')}
        onSuccess={(info) => {
          setOrderInfo(info);
          setView('success');
          saveOrder({
            bookingCode:  guestInfo.bookingCode ?? '',
            guestName:    info.guestName,
            propertyName: info.propertyName,
            checkinDate:  info.checkinDate,
            items:        info.items,
            notes:        info.notes,
            totalARS:     info.total,
          });
          notifyHost(info).then(setNotifResult);
        }}
        t={t}
        toUSD={toUSD}
      />
    );
  }

  // ── Browse view ───────────────────────────────────────────────────────────
  const cartTotalUSD = toUSD ? toUSD(cartTotal) : null;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-cream-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Logo + subtitle */}
          <div className="flex items-center gap-3 min-w-0">
            <Gestin6Logo size="md" />
            <div className="hidden sm:flex items-center">
              <span className="w-px h-5 bg-cream-300 mr-3" />
              <span className="font-body text-xs text-gray-400 whitespace-nowrap">
                {lang === 'es' ? 'Plataforma de huéspedes' : "Guest's Platform"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {rateLabel && (
              <span className="hidden lg:inline font-body text-[10px] text-gray-400 bg-cream-100 px-2.5 py-1.5 rounded-lg">
                {rateLabel}
              </span>
            )}
            <LangToggle />
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 hover:bg-cream-100 px-3 py-2 rounded-xl transition-colors duration-150"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3c-.63.63-.18 1.7.7 1.7H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-terra-300 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pop">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-terra-300/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sage-300/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 py-10 md:py-14">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-white leading-[1.15] mb-3">
            {guestInfo
              ? <>{t('hello')} <em className="not-italic text-terra-300">{guestInfo.guestName}</em> 👋</>
              : <>{t('stay_at')} <em className="not-italic text-terra-300">{activePropertyName}</em></>
            }
          </h1>

          <p className="font-body text-white/60 text-sm sm:text-base leading-relaxed mb-6 max-w-lg">
            {t('tagline')}
          </p>

          {/* Info chips */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-2">
              <svg className="w-3.5 h-3.5 text-terra-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-body text-xs text-white/80">
                {t('checkin_label')}: <strong className="text-white">{activeCheckinFmt}</strong>
              </span>
            </div>
            {guestInfo && (
              <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-2">
                <svg className="w-3.5 h-3.5 text-sage-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
                </svg>
                <span className="font-body text-xs text-white/80">{activePropertyName}</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-2">
              <svg className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-body text-xs text-white/80">
                {lang === 'es' ? 'Entrega al check-in' : 'Delivered at check-in'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main layout: sidebar + grid + cart ────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6 items-start">

        {/* ── Sidebar ── */}
        <aside className="hidden md:flex flex-col gap-0.5 w-44 flex-shrink-0 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-4">
          <p className="font-body text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 pb-2">
            {lang === 'es' ? 'Categorías' : 'Categories'}
          </p>
          {CATEGORIES.map(cat => {
            // "All" is active when we're on the home (idle) state with no category selected
            // Any other category is active when it matches activeCategoryId
            const isActive = cat.id === 'all'
              ? showPacks
              : activeCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-body text-sm transition-all duration-150
                  ${isActive
                    ? 'bg-gray-900 text-white font-semibold'
                    : 'text-gray-500 hover:bg-white hover:text-gray-800'
                  }`}
              >
                {cat.icon}
                <span className="truncate">{cat.label[lang] ?? cat.label.es}</span>
              </button>
            );
          })}
        </aside>

        {/* ── Center: search + grid ── */}
        <div className="flex-1 min-w-0">

          {/* Search bar */}
          <div className="mb-5 -mt-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-2.5">
              <SearchBar onSearch={searchProducts} isSearching={isLoading} t={t} />
            </div>
          </div>

          {/* ── Packs (home / idle state) ── */}
          {showPacks && (
            <PackSection
              lang={lang}
              applyMarkup={applyMarkup}
              toUSD={toUSD}
              onAdd={(product) => {
                if (product._dec) {
                  updateQuantity(product.id, (getQty(product.id) || 1) - 1);
                } else {
                  addToCart(product);
                }
              }}
              getQty={getQty}
            />
          )}

          {/* ── Error ── */}
          {hasError && (
            <div className="mt-16 text-center animate-fade-in">
              <p className="text-4xl mb-3">🔍</p>
              <h3 className="font-display text-xl text-gray-800 mb-1.5">{t('no_results')}</h3>
              <p className="font-body text-sm text-gray-400 mb-4 max-w-xs mx-auto">{search.error}</p>
              <button className="btn-ghost" onClick={resetToHome}>
                {t('try_again')}
              </button>
            </div>
          )}

          {/* ── Loading skeleton ── */}
          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-cream-200">
                  <div className="aspect-square bg-cream-200 animate-skeleton" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-cream-200 animate-skeleton rounded w-3/4" />
                    <div className="h-3 bg-cream-200 animate-skeleton rounded w-1/2" />
                    <div className="h-8 bg-cream-200 animate-skeleton rounded-xl mt-3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Products grid ── */}
          {hasResults && (
            <div className="animate-fade-in">
              <p className="font-body text-xs text-gray-400 mb-3">{t('results_found', search.products.length)}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {search.products.map((product, i) => (
                  <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${Math.min(i * 15, 200)}ms` }}>
                    <ProductCard
                      product={product}
                      quantity={getQty(product.id)}
                      onAdd={() => addToCart(product)}
                      onUpdateQuantity={(qty) => updateQuantity(product.id, qty)}
                      applyMarkup={applyMarkup}
                      toUSD={toUSD}
                      t={t}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Cart lateral (desktop) ── */}
        <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-20">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="font-body font-semibold text-sm text-gray-900">
                {lang === 'es' ? 'Carrito' : 'Cart'}
              </span>
              {cartCount > 0 && (
                <span className="bg-gray-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{cartCount}</span>
              )}
            </div>

            {cartCount === 0 ? (
              <div className="px-4 py-10 text-center">
                <svg className="w-8 h-8 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3c-.63.63-.18 1.7.7 1.7H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                <p className="font-body text-xs text-gray-400">
                  {lang === 'es' ? 'Tu carrito está vacío' : 'Your cart is empty'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {cart.map(({ product, quantity }) => {
                  const priceARS = applyMarkup(product.price);
                  const display  = toUSD ? `USD ${toUSD(priceARS * quantity)}` : `$${(priceARS * quantity).toLocaleString('es-AR')}`;
                  return (
                    <div key={product.id} className="px-3 py-2.5 flex items-center gap-2.5">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-gray-50"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-xs text-gray-800 line-clamp-1 leading-tight">{product.name}</p>
                        <p className="font-body text-xs text-gray-400 mt-0.5">×{quantity} · {display}</p>
                      </div>
                      <button
                        onClick={() => updateQuantity(product.id, 0)}
                        className="text-gray-300 hover:text-gray-600 transition-colors flex-shrink-0"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {cartCount > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-body text-xs text-gray-500">Total</span>
                  <span className="font-body font-bold text-sm text-gray-900">
                    {cartTotalUSD ? `USD ${cartTotalUSD}` : `$${cartTotal.toLocaleString('es-AR')}`}
                  </span>
                </div>
                <button
                  onClick={() => setView('checkout')}
                  className="w-full bg-gray-900 hover:bg-gray-800 active:scale-[0.98] text-white font-body font-semibold text-xs py-2.5 rounded-xl transition-all duration-150"
                >
                  {lang === 'es' ? 'Confirmar pedido' : 'Confirm order'}
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ── Floating checkout bar (mobile) ───────────────────── */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden px-4 pb-6 pt-12
                        bg-gradient-to-t from-cream-100 to-transparent pointer-events-none">
          <div className="max-w-sm mx-auto pointer-events-auto">
            <button
              onClick={() => setView('checkout')}
              className="w-full bg-gray-900 hover:bg-gray-800 active:scale-[0.98]
                         text-white font-body font-semibold text-sm
                         flex items-center justify-between
                         px-5 py-4 rounded-2xl shadow-float transition-all duration-150"
            >
              <span className="w-6 h-6 bg-white/15 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">
                {cartCount}
              </span>
              <span className="tracking-wide">{t('confirm_btn', cartCount, cartTotalUSD ?? cartTotal.toLocaleString('es-AR'))}</span>
              <span className="flex-shrink-0">{cartTotalUSD ? `USD ${cartTotalUSD}` : `$${cartTotal.toLocaleString('es-AR')}`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Cart drawer (mobile) */}
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateQuantity}
        cartTotal={cartTotal}
        applyMarkup={applyMarkup}
        onCheckout={() => { setIsCartOpen(false); setView('checkout'); }}
        toUSD={toUSD}
        t={t}
      />

      <footer className="text-center pb-8 pt-4">
        <p className="font-body text-xs text-gray-300">Powered by your host · gestin</p>
      </footer>
    </div>
  );
}

// ─── App (with LangProvider wrapper) ─────────────────────────────────────────
export default function App() {
  return (
    <LangProvider>
      <AppInner />
    </LangProvider>
  );
}
