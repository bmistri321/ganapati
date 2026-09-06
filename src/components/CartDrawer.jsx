import React, { useEffect } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Plus, Minus, AlertCircle, Sparkles, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

export const CartDrawer = () => {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    totalItemsCount,
    setIsCheckoutOpen,
  } = useCart();

  const { settings } = useSettings();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartOpen) setIsCartOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  const freeShippingLeft = Math.max(0, settings.freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(
    100,
    (subtotal / settings.freeShippingThreshold) * 100
  );

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto">
        <div className="w-full sm:w-screen sm:max-w-md bg-white shadow-2xl flex flex-col animate-slide-left border-l border-slate-200">
          
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Your Cart</h2>
                <p className="text-xs text-slate-500">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} selected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {cartItems.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Free Shipping Progress Bar */}
          <div className="bg-slate-50 px-4 sm:px-6 py-3 border-b border-slate-100">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
              {freeShippingLeft > 0 ? (
                <span className="text-slate-600">
                  Add <span className="font-bold text-emerald-700">{settings.currency}{freeShippingLeft.toFixed(2)}</span> for <span className="text-emerald-700 font-bold">FREE Shipping</span>
                </span>
              ) : (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> You've unlocked FREE Shipping!
                </span>
              )}
              <span className="text-slate-400 font-semibold">{Math.round(freeShippingProgress)}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Item List (Seamless List without Boxed Borders) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Your cart is empty</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Explore our modern catalog and add items with real-time stock availability.
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full shadow-sm transition-all cursor-pointer"
                >
                  Start Browsing
                </button>
              </div>
            ) : (
              cartItems.map((item) => {
                const itemKey = item.cartItemId || item.id;
                const isMax = item.quantity >= item.stock;
                const variantLabel = item.selectedVariant ? (item.selectedVariant.name || item.selectedVariant.size) : null;
                return (
                  <div
                    key={itemKey}
                    className="flex gap-3.5 items-center"
                  >
                    {/* Thumbnail (100% Full Fill Edge-to-Edge) */}
                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-slate-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {item.title}
                          </h4>
                          <button
                            onClick={() => removeFromCart(itemKey)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1 flex-shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-0.5">
                          {variantLabel && (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                              {variantLabel}
                            </span>
                          )}
                          <p className="text-xs text-slate-500 font-medium">
                            {settings.currency}{item.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2.5">
                        {/* Stepper */}
                        <div className="flex items-center border border-slate-200 rounded-xl bg-white px-1.5 py-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(itemKey, item.quantity - 1, item.stock)}
                            disabled={item.quantity <= 1}
                            className="p-1 text-slate-600 hover:text-slate-900 disabled:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title={item.quantity <= 1 ? "Use trash button to remove item" : "Decrease quantity"}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(itemKey, item.quantity + 1, item.stock)}
                            disabled={isMax}
                            className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Total price for this line */}
                        <span className="text-sm font-bold text-slate-900">
                          {settings.currency}{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      {isMax && (
                        <p className="text-[10px] text-amber-700 flex items-center gap-1 mt-1 font-medium">
                          <AlertCircle className="w-3 h-3" /> Max available inventory reached
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer / Checkout Button */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-white space-y-3.5">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{settings.currency}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Fulfillment</span>
                  <span className="text-slate-500 font-medium">Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Subtotal Amount</span>
                  <span className="text-emerald-700">{settings.currency}{subtotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-5 rounded text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 active:scale-98"
              >
                <span>Proceed to Cash on Delivery</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-center text-slate-400">
                🔒 Safe & Secure &bull; Cash on Delivery &bull; Instant WhatsApp Dispatch
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
