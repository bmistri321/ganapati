import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Search, Sparkles, User, UserCheck, FileText, MapPin, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ searchQuery, setSearchQuery, onHomeClick }) => {
  const { totalItemsCount, setIsCartOpen, justAddedId } = useCart();
  const { settings } = useSettings();
  const { customer, setIsAuthOpen, setIsOrdersOpen, setIsProfileOpen, logout } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      {/* Top micro banner */}
      <div className="bg-slate-900 text-slate-200 text-[11px] sm:text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1">
          Direct WhatsApp Verification &bull; Cash on Delivery (COD)
        </span>
        <span className="hidden md:inline text-slate-600">|</span>
        <span className="hidden md:inline text-emerald-400 font-bold">
          Free shipping on orders over {settings.currency}{settings.freeShippingThreshold}
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Logo & Tagline */}
          <div 
            onClick={onHomeClick}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group flex-shrink-0"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded bg-emerald-600 flex items-center justify-center text-white shadow-xs group-hover:bg-emerald-700 transition-colors">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-base sm:text-xl tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {settings.storeName}
                </h1>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider">
                  Live Stock
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block">
                {settings.tagline}
              </p>
            </div>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="flex-1 max-w-md mx-2 sm:mx-6 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder='Search products e.g. "Sattu", "Coconut", "Rice"...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 focus:border-emerald-600 rounded outline-none transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Actions: User Profile Icon & Shopping Cart Icon */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* 1. Profile State: User (Logged Out) or UserCheck (Logged In) */}
            {customer ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  title={`Logged in as ${customer.name || customer.fullName || 'Customer'}`}
                  className="relative p-2 rounded-full hover:bg-slate-100 text-slate-900 transition-all flex items-center justify-center active:scale-95"
                >
                  <UserCheck className="w-6 h-6 stroke-[1.8] text-slate-900" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded border border-slate-200 shadow-xl py-1.5 z-50 animate-fade-in divide-y divide-slate-100 text-xs">
                    <div className="px-3.5 py-2.5 bg-slate-50">
                      <p className="font-bold text-slate-900 truncate">{customer.name || customer.fullName || 'Verified Customer'}</p>
                      <p className="text-[11px] text-slate-500 font-mono">+91 {customer.phone}</p>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          setIsOrdersOpen(true);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 font-medium text-slate-700 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>My Orders & Invoices</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          setIsProfileOpen(true);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 font-medium text-slate-700 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>GPS Delivery Address</span>
                      </button>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-rose-50 flex items-center gap-2.5 font-medium text-rose-600 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                title="WhatsApp Quick Login"
                className="relative p-2 rounded-full hover:bg-slate-100 text-slate-900 transition-all flex items-center justify-center active:scale-95"
              >
                <User className="w-6 h-6 stroke-[1.8] text-slate-900" />
              </button>
            )}

            {/* 2. Cart State: ShoppingCart (Empty) or ShoppingCart with Black Badge (Active) */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              title={`Shopping Cart (${totalItemsCount} items)`}
              className={`relative p-2 rounded-full hover:bg-slate-100 text-slate-900 transition-all flex items-center justify-center active:scale-95 ${
                justAddedId ? 'scale-110' : ''
              }`}
            >
              <ShoppingCart className="w-6 h-6 stroke-[1.8] text-slate-900" />
              
              {totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center leading-none shadow-xs animate-scale-in">
                  {totalItemsCount}
                </span>
              )}
            </button>

          </div>

        </div>

        {/* Mobile Search Bar */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-300 focus:border-emerald-600 rounded outline-none transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
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
