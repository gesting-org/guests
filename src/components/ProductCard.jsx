import { useState } from 'react';

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' fill='%23f5f5f5'%3E%3Crect width='400' height='400'/%3E%3C/svg%3E";

export default function ProductCard({ product, quantity, onAdd, onUpdateQuantity, applyMarkup, toUSD, t }) {
  const [imgErr, setImgErr] = useState(false);
  const finalPriceARS = applyMarkup(product.price);
  const finalPriceUSD = toUSD ? toUSD(finalPriceARS) : null;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-card-hover transition-shadow duration-200 flex flex-col">
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-gray-50">
        <img
          src={!imgErr && product.imageUrl ? product.imageUrl : PLACEHOLDER}
          onError={() => setImgErr(true)}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1 gap-2">
        <h3 className="font-body font-medium text-sm text-gray-900 leading-snug line-clamp-2 flex-1">
          {product.name}
        </h3>

        <p className="font-body font-bold text-sm text-gray-900">
          {finalPriceUSD ? `USD ${finalPriceUSD}` : `$${finalPriceARS.toLocaleString('es-AR')}`}
        </p>

        {quantity === 0 ? (
          <button
            onClick={onAdd}
            className="w-full flex items-center justify-center gap-1.5
                       border border-gray-300 hover:border-gray-900 hover:bg-gray-900 hover:text-white
                       text-gray-800 bg-white font-body font-medium text-xs
                       py-2 rounded-lg transition-all duration-150 active:scale-[0.97]"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            {t('add_btn')}
          </button>
        ) : (
          <div className="flex items-center justify-between border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => onUpdateQuantity(quantity - 1)}
              className="flex-1 py-2 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-red-500 transition-colors duration-150"
            >
              {quantity === 1 ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4"/>
                </svg>
              )}
            </button>
            <span className="font-body font-bold text-sm text-gray-900 px-3 select-none border-x border-gray-200">
              {quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(quantity + 1)}
              className="flex-1 py-2 flex items-center justify-center text-gray-500 hover:bg-gray-900 hover:text-white transition-colors duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
