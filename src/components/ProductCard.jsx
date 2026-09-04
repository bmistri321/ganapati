import React from 'react';
import { Plus, Minus, Clock, Check, AlertTriangle, XCircle, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

export const ProductCard = ({ product, onSelectProduct }) => {
  const { addToCart, updateQuantity, cartItems } = useCart();
  const { settings } = useSettings();

  const cartItem = cartItems.find((i) => i.id === product.id);
  const qtyInCart = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const isMaxInCart = qtyInCart >= product.stock;

  return (
    <div className="group relative bg-white rounded border border-slate-200/90 hover:border-emerald-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
      
      {/* Product Image Area (Full Area Fill) */}
      <div 
        className="relative aspect-square w-full bg-slate-100 overflow-hidden cursor-pointer"
        onClick={() => onSelectProduct(product)}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
            <Package className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
        )}

        {/* Delivery / Fast Dispatch Tag */}
        <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1">
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-900/85 text-white backdrop-blur-xs">
            <Clock className="w-2.5 h-2.5 text-emerald-400" />
            10 MINS
          </span>
          {product.badge && (
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
              {product.badge}
            </span>
          )}
        </div>

        {/* Stock Alert Badge */}
        {isOutOfStock ? (
          <span className="absolute top-1.5 right-1.5 z-10 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
            Sold Out
          </span>
        ) : isLowStock ? (
          <span className="absolute top-1.5 right-1.5 z-10 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            {product.stock} left
          </span>
        ) : null}
      </div>

      {/* Product Details Area (Compact Density) */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Title */}
          <h3 
            onClick={() => onSelectProduct(product)}
            className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 hover:text-emerald-600 transition-colors cursor-pointer leading-snug"
            title={product.title}
          >
            {product.title}
          </h3>

          {/* Unit / Weight / Category Info */}
          <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
            {product.category || '1 unit'}
          </p>
        </div>

        {/* Price & Add Stepper Row */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                {settings.currency}{product.price.toFixed(0)}
              </span>
              {product.originalPrice && (
                <span className="text-[10px] text-slate-400 line-through">
                  {settings.currency}{product.originalPrice.toFixed(0)}
                </span>
              )}
            </div>
          </div>

          {/* Blinkit-Style Green ADD / Stepper Button */}
          {qtyInCart > 0 ? (
            <div className="flex items-center border border-emerald-600 bg-emerald-600 text-white rounded overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateQuantity(product.id, qtyInCart - 1, product.stock);
                }}
                title="Decrease"
                className="w-6 h-7 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-emerald-700 transition-colors font-bold active:scale-90"
              >
                <Minus className="w-3 h-3" />
              </button>
              
              <span className="w-5 sm:w-6 text-center text-xs font-black select-none">
                {qtyInCart}
              </span>
              
              <button
                type="button"
                disabled={isMaxInCart}
                onClick={(e) => {
                  e.stopPropagation();
                  updateQuantity(product.id, qtyInCart + 1, product.stock);
                }}
                title={isMaxInCart ? "Stock limit reached" : "Increase"}
                className="w-6 h-7 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold active:scale-90"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addToCart(product, 1)}
              disabled={isOutOfStock}
              title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded text-xs font-black uppercase tracking-wider transition-all shadow-xs active:scale-95 border ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                  : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border-emerald-600 shadow-emerald-600/10'
              }`}
            >
              <span>{isOutOfStock ? 'Out' : 'ADD'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
