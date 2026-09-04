import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Package, Clock, CheckCircle2, Truck, ExternalLink, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { fetchCustomerOrders } from '../services/apiService';
import { generateTaxInvoicePDF } from '../utils/invoiceGenerator';

export const MyOrdersModal = () => {
  const { isOrdersOpen, setIsOrdersOpen, customer } = useAuth();
  const { settings } = useSettings();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOrdersOpen) {
      setLoading(true);
      fetchCustomerOrders(customer?.phone).then((ords) => {
        setOrders(ords);
        setLoading(false);
      });
    }
  }, [isOrdersOpen, customer]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOrdersOpen) setIsOrdersOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOrdersOpen, setIsOrdersOpen]);

  if (!isOrdersOpen) return null;

  const getStatusBadge = (status) => {
    if (status?.includes('Delivered')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Delivered
        </span>
      );
    }
    if (status?.includes('Dispatched') || status?.includes('Way')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <Truck className="w-3 h-3 text-blue-600" />
          Dispatched / On the Way
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
        <Clock className="w-3 h-3 text-amber-600" />
        Pending COD Confirmation
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => setIsOrdersOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded shadow-2xl max-w-2xl w-full overflow-hidden z-10 animate-slide-up border border-slate-200/90 my-auto flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                My Orders & Tax Invoices
              </h2>
              <p className="text-xs text-slate-500">
                Track your Cash on Delivery orders and download GST tax invoices.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOrdersOpen(false)}
            className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Orders List Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="space-y-3 py-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
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
            orders.map((ord) => (
              <div
                key={ord.orderId || ord.id}
                className="bg-white rounded border border-slate-200 p-4 space-y-3 hover:border-emerald-300 transition-colors shadow-xs"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {ord.orderId || ord.invoice_number}
                      </span>
                      {getStatusBadge(ord.status)}
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Download Invoice</span>
                    </button>
                  </div>
                </div>

                {/* Items preview */}
                {ord.items && ord.items.length > 0 && (
                  <div className="space-y-1.5 text-xs text-slate-600">
                    {ord.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{item.title} &times; {item.quantity}</span>
                        <span className="font-semibold text-slate-800">
                          {settings.currency}{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Order Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">
                    Payment: <strong className="text-slate-700">Cash on Delivery (COD)</strong>
                  </span>
                  <div className="text-sm font-black text-slate-900">
                    Total: <span className="text-emerald-700">{settings.currency}{Number(ord.total || 0).toFixed(2)}</span>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
