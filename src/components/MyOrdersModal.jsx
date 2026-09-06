import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  ExternalLink, 
  MessageCircle,
  Store,
  MapPin,
  Sparkles,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { fetchCustomerOrders } from '../services/apiService';
import { generateTaxInvoicePDF } from '../utils/invoiceGenerator';
import { supabase } from '../services/supabase';

export const MyOrdersModal = () => {
  const { isOrdersOpen, setIsOrdersOpen, customer, currentCustomer } = useAuth();
  const { settings } = useSettings();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeCustomer = currentCustomer || customer;

  const loadOrders = async () => {
    setLoading(true);
    const ords = await fetchCustomerOrders(activeCustomer?.phone);
    setOrders(ords);
    setLoading(false);
  };

  useEffect(() => {
    if (isOrdersOpen) {
      loadOrders();
    }
  }, [isOrdersOpen, activeCustomer]);

  // Real-time Supabase listener for live status updates from XYVOT
  useEffect(() => {
    if (!isOrdersOpen) return;

    const channel = supabase
      .channel('my_orders_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales_orders' },
        (payload) => {
          // Re-fetch customer orders when any update happens in sales_orders
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOrdersOpen, activeCustomer]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOrdersOpen) setIsOrdersOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOrdersOpen, setIsOrdersOpen]);

  if (!isOrdersOpen) return null;

  const getStatusBadge = (status, isPickup) => {
    const s = (status || '').toLowerCase();

    if (s.includes('delivered') || s.includes('completed')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {isPickup ? 'Picked Up / Completed' : 'Delivered'}
        </span>
      );
    }
    if (s.includes('ready') || s.includes('ready_for_pickup')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs">
          <Store className="w-3 h-3 text-emerald-700" />
          Ready for Pickup at Store!
        </span>
      );
    }
    if (s.includes('confirmed') || s.includes('approved')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          Confirmed by Store
        </span>
      );
    }
    if (s.includes('dispatched') || s.includes('way') || s.includes('out_for_delivery')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200 shadow-xs">
          <Truck className="w-3 h-3 text-blue-600" />
          Out for Delivery (Today)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
        <Clock className="w-3 h-3 text-amber-600" />
        Pending Store Confirmation
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={() => setIsOrdersOpen(false)}
      />

      {/* Slide-over Right Side Panel Drawer (sm:max-w-md matching all app drawers) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto">
        <div className="w-full sm:w-screen sm:max-w-md bg-white shadow-2xl flex flex-col animate-slide-left border-l border-slate-200 h-full overflow-hidden">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between bg-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200/80">
                <Package className="w-5 h-5 text-slate-800" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Order History
                </h2>
                <p className="text-xs text-slate-500">
                  Track live orders & invoices
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOrdersOpen(false)}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Orders List Content */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            {loading ? (
              <div className="space-y-3 py-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">No orders placed yet</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Browse our inventory and place your first Cash on Delivery order with instant WhatsApp dispatch.
                  </p>
                </div>
              </div>
            ) : (
              orders.map((ord) => {
                const isPickup = ord.deliveryMethod === 'pickup' || (ord.delivery_address && ord.delivery_address.toLowerCase().includes('pickup'));
                const isConfirmed = ord.status && (ord.status.toLowerCase().includes('confirmed') || ord.status.toLowerCase().includes('ready'));

                return (
                  <div
                    key={ord.orderId || ord.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 hover:border-slate-300 transition-colors shadow-xs"
                  >
                    {/* Order Top Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-slate-900">
                            {ord.orderId || ord.invoice_number}
                          </span>
                          {getStatusBadge(ord.status, isPickup)}
                        </div>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                          Placed on {new Date(ord.createdAt || Date.now()).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* 1-Click PDF Download Button */}
                        <button
                          type="button"
                          onClick={() => generateTaxInvoicePDF(ord, settings)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-black text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Tax Invoice</span>
                        </button>
                      </div>
                    </div>

                    {/* Real-time Pickup / Delivery Time Banner */}
                    {isPickup ? (
                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 flex items-start gap-2">
                        <Store className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">
                            {isConfirmed ? '⚡ Confirmed for Store Pickup' : 'Store Pickup Order'}
                          </span>
                          <span className="text-emerald-800 text-[11px] block mt-0.5">
                            {isConfirmed 
                              ? `Pickup Ready Today! Location: ${settings.storeName || 'Ganapati Store'} (${settings.storeAddress || 'Main Market Road, Habra'})`
                              : 'Pickup time will be confirmed as soon as the store approves your order.'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2">
                        <Truck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-900 block">
                            ⚡ Delivery Address (Expected Today)
                          </span>
                          <span className="text-slate-600 text-[11px] block mt-0.5">
                            {ord.delivery_address || (ord.customer?.address ? `${ord.customer.address}, ${ord.customer.city}` : 'Direct Doorstep Delivery')}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Items preview */}
                    {ord.items && ord.items.length > 0 && (
                      <div className="space-y-1.5 text-xs text-slate-600 bg-[#F8F9FA] p-2.5 rounded-xl border border-slate-100">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="font-medium">
                              {item.title || item.product_name} {item.variant_name ? `(${item.variant_name})` : ''} &times; {item.quantity}
                            </span>
                            <span className="font-bold text-slate-800">
                              {settings.currency}{((item.price || item.unit_price || 0) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Order Footer */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 font-medium">
                        Payment: <strong className="text-slate-700">{ord.payment_method || 'Cash on Delivery (COD)'}</strong>
                      </span>
                      <div className="text-sm font-black text-slate-900">
                        Total: <span className="text-emerald-700">{settings.currency}{Number(ord.total || ord.total_amount || 0).toFixed(2)}</span>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
