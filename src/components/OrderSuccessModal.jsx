import React, { useState } from 'react';
import { CheckCircle2, MessageCircle, Copy, Check, ExternalLink, ArrowRight, Database, MapPin, Store, Download, FileText } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { generateTaxInvoicePDF } from '../utils/invoiceGenerator';

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

  const handleDownloadInvoice = () => {
    generateTaxInvoicePDF(order, settings);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in" />

      {/* Modern White Minimalist Card */}
      <div className="relative bg-white rounded shadow-2xl max-w-lg w-full overflow-hidden z-10 animate-slide-up border border-slate-200/90 my-auto p-6 sm:p-8 text-center space-y-6">
        
        {/* Celebration Icon */}
        <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
          <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Order Submitted (Cash on Delivery)
          </h2>
          <p className="text-xs text-slate-500">
            Thank you, <strong className="text-slate-800">{order.customer?.name}</strong>. Your order has been registered and scheduled for dispatch.
          </p>
        </div>

        {/* Order Details Receipt Card */}
        <div className="bg-slate-50 rounded p-4 border border-slate-200 text-left space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Order Reference:</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {order.orderId || order.invoice_number}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Payment Mode:</span>
            <span className="font-bold text-slate-800">
              Cash on Delivery (COD)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Total Payable:</span>
            <span className="font-black text-sm text-emerald-700">
              {settings.currency}{Number(order.total || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleOpenWhatsApp}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 active:scale-98"
          >
            <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
            <span>Open WhatsApp to Confirm Dispatch</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>

          {/* 1-Click PDF Tax Invoice Download */}
          <button
            onClick={handleDownloadInvoice}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded text-xs uppercase tracking-wider transition-all shadow-xs active:scale-98"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Tax Invoice (PDF)</span>
          </button>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCopy}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
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
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
