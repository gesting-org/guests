import { useState, useEffect } from 'react';
import PackModal from './PackModal.jsx';
import Portal from './Portal.jsx';

const FOOD_KEYWORDS = [
  'almacén','almacen','alimento','comida','food','grocery',
  'bebida','agua','gaseosa','jugo','vino','cerveza','sidra','soda','espirituosa','whisky','vodka','gin','fernet','aperitivo','licor','champagne','espumante',
  'lácteo','lacteo','leche','yogur','queso','manteca','crema','ricota','dulce de leche',
  'carne','aves','pollo','pescado','mariscos','fiambre','embutido','salchicha','chorizo','hamburguesa',
  'panadería','panaderia','pan','facturas','repostería','reposteria','galleta','bizcocho','tostada','budín',
  'fruta','verdura','vegetal','hortaliza','tuberculo','greengrocery',
  'congelado','frozen',
  'cereal','granola','avena','arroz','fideos','pasta','harina','legumbre','lentejas','garbanzo','porotos',
  'aceite','vinagre','condimento','salsa','ketchup','mayonesa','mostaza','conserva','enlatado','pickles',
  'azúcar','azucar','sal','especias','pimienta','edulcorante','stevia',
  'chocolate','golosina','caramelo','dulce','mermelada','miel','snack','maní','nuez','fruto seco','pochoclo',
  'café','cafe','té','te ','yerba','mate','cacao','infusión','infusion','capsula',
  'desayuno','dietética','dietetica','organico','orgánico',
];
const BLOCKED = [
  'electrodoméstico','electrodomestico','electrónica','electronica','tecnología','tecnologia',
  'celular','computadora','tablet','televisor','heladera','lavarropas','microondas',
  'mueble','colchon','colchón','hogar','decoración','decoracion',
  'juguete','juego','deporte','bicicleta','camping',
  'ropa','calzado','indumentaria','textil',
  'ferretería','ferreteria','herramienta',
  'limpieza','detergente','lavandina','desinfectante','jabón para ropa','suavizante',
  'higiene','perfumería','perfumeria','desodorante','shampoo','champú','maquillaje','cosmético',
  'mascota','petfood',
  'farmacia','medicamento','vitamina','suplemento',
  'automotor','auto ','jardín','jardin','piscina',
  'librería','libreria','papelería','papeleria','oficina',
];

function isFood(product) {
  const cats = (product.categories ?? []).join(' ').toLowerCase();
  const name = (product.productName ?? '').toLowerCase();
  const blocked = ['mascota','petfood','gato','gata','perro','perros','pájaro','pajaro','alimento para','comida para','pet food','gatitos','perritos'];
  if (blocked.some(k => name.includes(k) || cats.includes(k))) return false;
  if (BLOCKED.some(k => cats.includes(k))) return false;
  if (FOOD_KEYWORDS.some(k => cats.includes(k))) return true;
  return false;
}

function normalizeProduct(item, idx) {
  const offer  = item.items?.[0]?.sellers?.[0]?.commertialOffer ?? {};
  const rawImg = item.items?.[0]?.images?.[0]?.imageUrl ?? '';
  return {
    id:       `pack-${idx}-${item.productId}`,
    name:     item.productName ?? item.items?.[0]?.nameComplete ?? 'Producto',
    price:    offer.Price ?? 0,
    imageUrl: rawImg ? rawImg.replace(/\/arquivos\/ids\/(\d+).*/, '/arquivos/ids/$1-400-400') : '',
    description: (item.metaTagDescription ?? item.description ?? '').replace(/<[^>]+>/g,'').trim().slice(0,80),
  };
}

async function fetchBest(query) {
  const url = `/api/carrefour/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=49&O=OrderByScoreDESC`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data)) return null;
  const foods = data.filter(isFood).map(normalizeProduct);
  return foods.find(p => p.price > 0 && p.imageUrl) ?? foods[0] ?? null;
}

const PACK_DEFS = {
  es: [
    { id: 'desayuno', name: 'Desayuno',  desc: 'Para arrancar el día',     queries: ['leche','cafe','pan','manteca','mermelada'] },
    { id: 'despensa', name: 'Despensa',  desc: 'Básicos de la cocina',     queries: ['arroz','fideos','aceite','sal','azucar'] },
    { id: 'snacks',   name: 'Snacks',    desc: 'Para picar sin parar',     queries: ['galletitas','chocolate','mani','papas fritas','jugo'] },
    { id: 'frescos',  name: 'Frescos',   desc: 'Lácteos y refrigerados',   queries: ['yogur','queso','crema','huevo','manteca'] },
  ],
  en: [
    { id: 'breakfast', name: 'Breakfast', desc: 'Start the day right',     queries: ['leche','cafe','pan','manteca','mermelada'] },
    { id: 'pantry',    name: 'Pantry',    desc: 'Cooking essentials',      queries: ['arroz','fideos','aceite','sal','azucar'] },
    { id: 'snacks',    name: 'Snacks',    desc: 'For non-stop munching',   queries: ['galletitas','chocolate','mani','papas fritas','jugo'] },
    { id: 'fresh',     name: 'Fresh',     desc: 'Dairy & refrigerated',    queries: ['yogur','queso','crema','huevo','manteca'] },
  ],
};

// Íconos SVG por pack
const PACK_ICONS = {
  desayuno:  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zm4-7v3m4-3v3m4-3v3"/></svg>,
  breakfast: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zm4-7v3m4-3v3m4-3v3"/></svg>,
  despensa:  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm0 5h14M9 3v18"/></svg>,
  pantry:    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm0 5h14M9 3v18"/></svg>,
  snacks:    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6l3-3 3 3M12 3v9"/></svg>,
  frescos:   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>,
  fresh:     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>,
};

function PackCard({ pack, products, applyMarkup, toUSD, onAdd, getQty, lang }) {
  const [showModal, setShowModal] = useState(false);
  const count = products !== null ? products.length : pack.queries.length;
  const loading = products === null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="group w-full bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 text-left hover:border-gray-300 hover:shadow-card transition-all duration-150 active:scale-[0.98]"
      >
        {/* Icon box */}
        <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500 group-hover:bg-gray-900 group-hover:text-white transition-colors duration-150">
          {PACK_ICONS[pack.id]}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-body font-semibold text-sm text-gray-900">{pack.name}</p>
          <p className="font-body text-xs text-gray-400 mt-0.5">{pack.desc}</p>
        </div>

        {/* Count + arrow */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {loading ? (
            <div className="w-5 h-5 rounded-full bg-gray-100 animate-skeleton" />
          ) : (
            <span className="font-body text-xs text-gray-400">{count} items</span>
          )}
          <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </div>
      </button>

      {showModal && (
        <Portal>
          <PackModal
            pack={pack}
            products={products || []}
            onClose={() => setShowModal(false)}
            applyMarkup={applyMarkup}
            toUSD={toUSD}
            onAdd={onAdd}
            getQty={getQty}
            lang={lang}
          />
        </Portal>
      )}
    </>
  );
}

export default function PackSection({ lang, applyMarkup, toUSD, onAdd, getQty }) {
  const packs = PACK_DEFS[lang] ?? PACK_DEFS.en;
  const [preloadedProducts, setPreloadedProducts] = useState({});

  useEffect(() => {
    const loadAll = async () => {
      const results = {};
      for (const pack of packs) {
        const prods = await Promise.all(pack.queries.map(fetchBest));
        results[pack.id] = prods.filter(Boolean);
      }
      setPreloadedProducts(results);
    };
    loadAll();
  }, [packs]);

  return (
    <div className="mb-8 animate-fade-in">
      <p className="font-body text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
        {lang === 'es' ? 'Packs sugeridos' : 'Suggested packs'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {packs.map(pack => (
          <PackCard
            key={pack.id}
            pack={pack}
            products={preloadedProducts[pack.id] ?? null}
            applyMarkup={applyMarkup}
            toUSD={toUSD}
            onAdd={onAdd}
            getQty={getQty}
            lang={lang}
          />
        ))}
      </div>
    </div>
  );
}
