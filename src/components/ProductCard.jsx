import React from 'react';
import { Plus, Minus, Eye, Star, Check, AlertTriangle, XCircle, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

export const ProductCard = ({ product, onSelectProduct }) => {
  const { addToCart, updateQuantity, cartItems } = useCart();
  const { settings } = useSettings();

  const cartItem = cartItems.find((i) => i.id === product.id);
  const qtyInCart = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 4;
  const isMaxInCart = qtyInCart >= product.stock;

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      
      {/* Image Container with Badge */}
      <div 
        className="relative aspect-square w-full bg-slate-100 overflow-hidden cursor-pointer"
        onClick={() => onSelectProduct(product)}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center text-slate-400 p-4">
            <Package className="w-12 h-12 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            <span className="text-[11px] font-semibold text-slate-500 mt-2 text-center uppercase tracking-wider">
              {product.category || 'Inventory Item'}
            </span>
          </div>
        )}

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.badge && (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase bg-slate-900/90 backdrop-blur-md text-white shadow-sm">
              {product.badge}
            </span>
          )}
          {product.originalPrice && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-rose-500 text-white shadow-sm">
              Sale
            </span>
          )}
        </div>

        {/* Stock status pill top-right */}
        <div className="absolute top-3 right-3 z-10">
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100/90 backdrop-blur-md text-rose-700 border border-rose-200">
              <XCircle className="w-3 h-3" />
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100/90 backdrop-blur-md text-amber-800 border border-amber-200 animate-pulse-subtle">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              Only {product.stock} Left
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100/90 backdrop-blur-md text-emerald-800 border border-emerald-200">
              <Check className="w-3 h-3 text-emerald-600" />
              {product.stock} in Stock
            </span>
          )}
        </div>

        {/* Quick View hover overlay */}
        <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-white/95 backdrop-blur-md text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5 text-emerald-600" /> Quick View
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              {product.category}
            </span>
            <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{product.rating}</span>
              <span className="text-slate-400 text-[10px]">({product.reviewsCount})</span>
            </div>
          </div>

          {/* Title */}
          <h3 
            onClick={() => onSelectProduct(product)}
            className="font-bold text-slate-900 text-sm sm:text-base line-clamp-1 hover:text-emerald-600 transition-colors cursor-pointer"
          >
            {product.title}
          </h3>

          {/* Description Snippet */}
          <p className="text-slate-500 text-xs line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Quantity Stepper Action */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-extrabold text-slate-900">
                {settings.currency}{product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-slate-400 line-through">
                  {settings.currency}{product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500">
              {qtyInCart > 0 ? `${qtyInCart} in cart` : 'Instant checkout'}
            </span>
          </div>

          {/* Quantity Stepper with Minus / Number / Plus */}
          {qtyInCart > 0 ? (
            <div className="flex items-center border border-emerald-600 bg-emerald-50 rounded-xl overflow-hidden shadow-sm animate-fade-in">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateQuantity(product.id, qtyInCart - 1, product.stock);
                }}
                title="Decrease quantity"
                className="w-8 h-8 flex items-center justify-center text-emerald-800 hover:bg-emerald-200 transition-colors font-bold active:scale-90"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              
              <span className="w-7 text-center text-xs font-black text-emerald-900 select-none">
                {qtyInCart}
              </span>
              
              <button
                type="button"
                disabled={isMaxInCart}
                onClick={(e) => {
                  e.stopPropagation();
                  updateQuantity(product.id, qtyInCart + 1, product.stock);
                }}
                title={isMaxInCart ? "Stock limit reached" : "Increase quantity"}
                className="w-8 h-8 flex items-center justify-center text-emerald-800 hover:bg-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold active:scale-90"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addToCart(product, 1)}
              disabled={isOutOfStock}
              title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              className={`flex items-center justify-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:shadow-md'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{isOutOfStock ? 'Sold Out' : 'Add'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
