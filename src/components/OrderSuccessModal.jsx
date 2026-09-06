import React from 'react';
import { CheckCircle2, Download, ArrowRight, Smartphone, ShieldCheck, Store, Truck, Clock, MapPin, Building2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { generateTaxInvoicePDF } from '../utils/invoiceGenerator';

export const OrderSuccessModal = ({ orderDetails, onClose }) => {
  const { settings } = useSettings();

  if (!orderDetails) return null;

  const order = orderDetails.placedOrder || orderDetails.order || orderDetails;
  const invoiceNumber = order?.invoice_number || order?.orderId || 'INV-2026';
  const customerPhone = order?.customer_phone || order?.customer?.phone || settings.whatsappNumber;
  const isPickup = order?.deliveryMethod === 'pickup' || orderDetails?.deliveryMethod === 'pickup';

  const downloadInvoicePdf = () => {
    generateTaxInvoicePDF(order, settings);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in" />

      {/* Modern White Minimalist Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden z-10 animate-slide-up border border-slate-200/90 my-auto p-6 sm:p-8 text-center space-y-5">
        
        {/* Celebration Icon */}
        <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
          <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
        </div>

        {/* Title & Invoice ID */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isPickup ? 'Store Pickup Order Placed!' : 'Order Placed Successfully!'}
          </h2>
          <p className="text-xs text-slate-500">
            Order & Invoice <strong className="text-slate-900 font-mono">#{invoiceNumber}</strong>
          </p>
        </div>

        {/* Dispatch Notice / Same-day Delivery Banner */}
        {isPickup ? (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-left flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Pickup Time Confirmation Pending</span>
              <span className="text-amber-800 text-[11px] leading-relaxed">
                The store will confirm your pickup time shortly in <strong>My Orders</strong>.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 text-left flex items-start gap-2.5">
            <Truck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">⚡ Delivery Expected Today</span>
              <span className="text-emerald-800 text-[11px] leading-relaxed">
                Your order is packed fresh and dispatched directly to your doorstep today.
              </span>
            </div>
          </div>
        )}

        {/* WhatsApp Receipt Notice */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-center justify-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Confirmation receipt sent to <strong>WhatsApp (+91 {customerPhone})</strong>
          </span>
        </div>

        {/* Order Details Receipt Card */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Customer:</span>
            <span className="font-bold text-slate-900">
              {order?.customer_name || order?.customer?.name || 'Verified Customer'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Delivery Mode:</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              {isPickup ? (
                <>
                  <Store className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Store Pickup</span>
                </>
              ) : (
                <>
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Home Delivery (Today)</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Payment Mode:</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Cash on Delivery (COD)
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
            <span className="text-slate-500 font-bold">Total Amount:</span>
            <span className="font-black text-sm text-emerald-700">
              {settings.currency}{Number(order?.total_amount || order?.total || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* 📄 Download Digital Tax Invoice */}
          <button
            onClick={downloadInvoicePdf}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Digital Tax Invoice</span>
          </button>

          <button
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors cursor-pointer"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
