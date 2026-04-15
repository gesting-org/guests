import { useState } from 'react';

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' fill='%23f5f5f5'%3E%3Crect width='400' height='400'/%3E%3C/svg%3E";

export default function PackModal({ pack, products, onClose, applyMarkup, toUSD, onAdd, getQty, lang }) {
  const [addingAll, setAddingAll] = useState(false);

  const handleAddAll = () => {
    setAddingAll(true);
    products.forEach(product => onAdd(product));
    setTimeout(() => { setAddingAll(false); onClose(); }, 400);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div
          className="bg-white w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col pointer-events-auto animate-slide-up"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-body font-semibold text-gray-900 text-base">{pack.name}</h2>
              <p className="font-body text-xs text-gray-400 mt-0.5">{pack.desc}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Products */}
          <div className="flex-1 overflow-y-auto p-4">
            {products && products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {products.map((product) => {
                  const qty = getQty(product.id);
                  const priceARS = applyMarkup(product.price);
                  const priceDisplay = toUSD ? `USD ${toUSD(priceARS)}` : `$${priceARS.toLocaleString('es-AR')}`;

                  return (
                    <div key={product.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col hover:shadow-card transition-shadow">
                      <div className="aspect-square overflow-hidden bg-gray-50">
                        <img
                          src={product.imageUrl || PLACEHOLDER}
                          onError={e => { e.target.src = PLACEHOLDER; }}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-3 flex flex-col flex-1 gap-2">
                        <p className="font-body text-xs font-medium text-gray-900 line-clamp-2 flex-1">{product.name}</p>
                        <p className="font-body font-bold text-sm text-gray-900">{priceDisplay}</p>
                        {qty === 0 ? (
                          <button
                            onClick={() => onAdd(product)}
                            className="w-full border border-gray-300 hover:border-gray-900 hover:bg-gray-900 hover:text-white text-gray-800 font-body font-medium text-xs py-1.5 rounded-lg transition-all duration-150"
                          >
                            + {lang === 'es' ? 'Agregar' : 'Add'}
                          </button>
                        ) : (
                          <div className="flex items-center justify-between border border-gray-200 rounded-lg overflow-hidden">
                            <button
                              onClick={() => onAdd({ ...product, _dec: true })}
                              className="flex-1 py-1.5 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4"/></svg>
                            </button>
                            <span className="font-body font-bold text-sm text-gray-900 px-2 border-x border-gray-200">{qty}</span>
                            <button
                              onClick={() => onAdd(product)}
                              className="flex-1 py-1.5 flex items-center justify-center text-gray-400 hover:bg-gray-900 hover:text-white transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="font-body text-sm text-gray-400">{lang === 'es' ? 'Cargando productos...' : 'Loading products...'}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {products && products.length > 0 && (
            <div className="px-4 py-4 border-t border-gray-100">
              <button
                onClick={handleAddAll}
                disabled={addingAll}
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-body font-semibold text-sm py-3 rounded-xl transition-all duration-150 active:scale-[0.98]"
              >
                {addingAll
                  ? (lang === 'es' ? 'Agregando...' : 'Adding...')
                  : (lang === 'es' ? `Agregar pack completo · ${products.length} productos` : `Add complete pack · ${products.length} items`)}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
