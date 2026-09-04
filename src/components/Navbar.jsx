import React from 'react';
import { ShoppingBag, Search, Sparkles, MessageCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

export const Navbar = ({ searchQuery, setSearchQuery, onHomeClick }) => {
  const { totalItemsCount, setIsCartOpen, justAddedId } = useCart();
  const { settings } = useSettings();

  return (
    <header className="sticky top-0 z-40 glass-header">
      {/* Top micro banner */}
      <div className="bg-emerald-900 text-emerald-100 text-[11px] sm:text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
          Direct WhatsApp Order Verification &bull; No Login Required
        </span>
        <span className="hidden md:inline text-emerald-300">|</span>
        <span className="hidden md:inline text-emerald-200">
          Free shipping on orders over {settings.currency}{settings.freeShippingThreshold}
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Logo & Tagline */}
          <div 
            onClick={onHomeClick}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg sm:text-xl tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {settings.storeName}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                  Live Stock
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {settings.tagline}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-2 sm:mx-6 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products, gear, lifestyle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded-xl outline-none transition-all placeholder:text-slate-400 focus:shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 bg-slate-200/80 rounded-full px-1.5 py-0.5"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Actions: Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Drawer Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative flex items-center gap-2.5 bg-slate-900 hover:bg-emerald-700 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-sm transition-all shadow-md active:scale-95 ${
                justAddedId ? 'ring-4 ring-emerald-400/50 scale-105' : ''
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline font-semibold">Cart</span>
              
              {totalItemsCount > 0 ? (
                <span className="bg-emerald-500 text-white font-bold text-xs px-2 py-0.5 rounded-full animate-fade-in shadow-sm">
                  {totalItemsCount}
                </span>
              ) : (
                <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full">
                  0
                </span>
              )}
            </button>
          </div>

        </div>

        {/* Mobile Search Bar */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 border border-transparent focus:border-emerald-500 rounded-xl outline-none transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full px-1.5 py-0.5"
              >
                ✕
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
