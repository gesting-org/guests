import { useEffect } from 'react';

export default function Cart({ isOpen, onClose, cart, onUpdateQuantity, cartTotal, applyMarkup, onCheckout, toUSD, t }) {
  const empty = cart.length === 0;
  const totalUSD  = toUSD ? toUSD(cartTotal) : null;
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const fmt = (ars, usd) => usd ? `$${usd.toFixed(2)}` : `$${ars.toLocaleString('es-AR')}`;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 bottom-0 z-[61] w-full max-w-[340px] bg-white flex flex-col shadow-panel animate-slide-right">

        {/* Header */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-body font-bold text-xl text-gray-900">{t('cart_title')}</h2>
              {!empty && (
                <p className="font-body text-sm text-gray-400 mt-0.5">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors mt-0.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {empty ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <svg className="w-10 h-10 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3c-.63.63-.18 1.7.7 1.7H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <p className="font-body font-medium text-gray-500 text-sm">{t('cart_empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {cart.map(({ product, quantity }) => {
                const priceARS = applyMarkup(product.price);
                const lineARS  = priceARS * quantity;
                const lineUSD  = toUSD ? toUSD(lineARS) : null;
                return (
                  <div key={product.id} className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-body font-medium text-sm text-gray-900 leading-snug flex-1">
                        {product.name}
                      </p>
                      <p className="font-body font-semibold text-sm text-gray-900 flex-shrink-0">
                        {fmt(lineARS, lineUSD)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="font-body text-xs text-gray-400">
                        Qty: {quantity}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                          className="w-6 h-6 rounded-full border border-gray-200 hover:border-gray-400 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4"/>
                          </svg>
                        </button>
                        <span className="font-body text-xs font-semibold text-gray-700 w-4 text-center">{quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                          className="w-6 h-6 rounded-full border border-gray-200 hover:border-gray-400 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!empty && (
          <div className="px-5 py-5 border-t border-gray-100">
            {/* Subtotal */}
            <div className="flex justify-between items-center mb-2">
              <span className="font-body text-sm text-gray-500">Subtotal</span>
              <span className="font-body text-sm text-gray-900">{fmt(cartTotal, totalUSD)}</span>
            </div>
            {/* Delivery */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="font-body text-sm text-gray-500">Delivery</span>
              <span className="font-body text-sm text-gray-900">Free</span>
            </div>
            {/* Total */}
            <div className="flex justify-between items-center mt-4 mb-5">
              <span className="font-body font-bold text-base text-gray-900">Total</span>
              <span className="font-body font-bold text-base text-gray-900">{fmt(cartTotal, totalUSD)}</span>
            </div>

            <button
              onClick={onCheckout}
              className="w-full bg-gray-900 hover:bg-gray-800 active:scale-[0.98] text-white font-body font-semibold text-sm py-3.5 rounded-xl transition-all duration-150"
            >
              {t('pay_btn')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
