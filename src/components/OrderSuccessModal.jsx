import React, { useState } from 'react';
import { CheckCircle2, MessageCircle, Copy, Check, ExternalLink, ArrowRight, Database, MapPin, Store } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export const OrderSuccessModal = ({ orderDetails, onClose }) => {
  const { settings } = useSettings();
  const [copied, setCopied] = useState(false);

  if (!orderDetails) return null;

  const { order, whatsappUrl, whatsappMsg } = orderDetails;

  const handleCopy = () => {
    navigator.clipboard.writeText(whatsappMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md transition-opacity animate-fade-in" />

      {/* Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden z-10 animate-slide-up border border-emerald-100 my-auto p-6 sm:p-8 text-center space-y-6">
        
        {/* Animated Celebration Icon */}
        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 animate-pulse-subtle">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Order Submitted Successfully!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Thank you, <span className="font-semibold text-slate-900">{order.customer.name}</span>. Your order has been registered and prepared for WhatsApp transmission.
          </p>
        </div>

        {/* Order Details Receipt Card */}
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 text-left space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
            <span className="text-slate-500 font-medium">Order Reference:</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {order.orderId}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Fulfillment Type:</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              {order.deliveryMethod === 'shipping' ? (
                <>
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Home Delivery
                </>
              ) : (
                <>
                  <Store className="w-3.5 h-3.5 text-emerald-600" /> Store Pickup
                </>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Total Amount:</span>
            <span className="font-extrabold text-sm text-emerald-700">
              {settings.currency}{order.total.toFixed(2)}
            </span>
          </div>

          {/* Firestore indicator */}
          <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 flex items-center gap-1 font-medium">
              <Database className="w-3 h-3 text-emerald-600" />
              Database Sync:
            </span>
            <span className={`font-medium px-2 py-0.5 rounded ${
              order.savedToFirestore
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-200 text-slate-700'
            }`}>
              {order.savedToFirestore ? 'Saved in Firestore' : 'Stored in Local Orders'}
            </span>
          </div>
        </div>

        {/* WhatsApp Actions */}
        <div className="space-y-3">
          <button
            onClick={handleOpenWhatsApp}
            className="w-full flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-5 rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/25 active:scale-98"
          >
            <MessageCircle className="w-5 h-5 fill-white text-emerald-600" />
            <span>Open WhatsApp to Confirm Order</span>
            <ExternalLink className="w-4 h-4 opacity-80" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Order Text</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white transition-colors"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          A copy of your order has been saved. We look forward to fulfilling your request!
        </p>

      </div>
    </div>
  );
};
