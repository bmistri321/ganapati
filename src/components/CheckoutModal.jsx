import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Truck, Store, MapPin, CheckCircle2, MessageCircle, AlertCircle, ArrowLeft, ShieldCheck, Clock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { LocationPicker } from './LocationPicker';
import { saveOrder, formatWhatsAppMessage, buildWhatsAppUrl } from '../services/orderService';

export const CheckoutModal = ({ onOrderSuccess }) => {
  const { isCheckoutOpen, setIsCheckoutOpen, cartItems, subtotal, clearCart } = useCart();
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [deliveryMethod, setDeliveryMethod] = useState('shipping'); // 'shipping' | 'pickup'

  // Contact State
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
  });

  // Shipping Address State
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    coordinates: { lat: 28.6139, lng: 77.2090 }
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreviewMessage, setShowPreviewMessage] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCheckoutOpen) setIsCheckoutOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCheckoutOpen, setIsCheckoutOpen]);

  if (!isCheckoutOpen) return null;

  // Calculate delivery fee
  const deliveryFee = deliveryMethod === 'shipping' 
    ? (subtotal >= settings.freeShippingThreshold ? 0 : settings.flatShippingFee)
    : 0;

  const grandTotal = subtotal + deliveryFee;

  const validate = () => {
    const errs = {};
    if (!customer.name.trim()) errs.name = 'Full name is required';
    if (!customer.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (customer.phone.trim().length < 7) {
      errs.phone = 'Please enter a valid phone number';
    }

    if (deliveryMethod === 'shipping') {
      if (!shippingAddress.street.trim()) errs.street = 'Street address is required';
      if (!shippingAddress.city.trim()) errs.city = 'City is required';
      if (!shippingAddress.state.trim()) errs.state = 'State / Region is required';
      if (!shippingAddress.postalCode.trim()) errs.postalCode = 'Postal / ZIP code is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) {
      showToast('Please fill in all required fields marked in red.', 'error');
      return;
    }

    if (cartItems.length === 0) {
      showToast('Your cart is empty', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customer,
        deliveryMethod,
        shippingAddress: deliveryMethod === 'shipping' ? shippingAddress : null,
        items: cartItems.map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        subtotal,
        deliveryFee,
        total: grandTotal,
      };

      // 1. Save to Firebase Firestore & local fallback
      const savedOrder = await saveOrder(orderPayload);

      // 2. Generate WhatsApp message & URL
      const whatsappMsg = formatWhatsAppMessage(savedOrder, settings);
      const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, whatsappMsg);

      // 3. Clear cart & close checkout modal
      clearCart();
      setIsCheckoutOpen(false);

      // 4. Trigger success screen with order & WhatsApp redirection
      onOrderSuccess({
        order: savedOrder,
        whatsappUrl,
        whatsappMsg,
      });

      // Auto-open WhatsApp in a new tab/window
      try {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.log('Popup blocked or handled via success button', e);
      }

    } catch (err) {
      console.error('Order placement error:', err);
      showToast('Failed to process order. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live preview order message
  const previewOrder = {
    orderId: 'ORD-PREVIEW',
    createdAt: new Date().toISOString(),
    customer: {
      name: customer.name || 'John Doe',
      phone: customer.phone || '+1 555 0192',
      email: customer.email || ''
    },
    deliveryMethod,
    shippingAddress,
    items: cartItems,
    subtotal,
    deliveryFee,
    total: grandTotal
  };
  const previewMessageText = formatWhatsAppMessage(previewOrder, settings);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={() => setIsCheckoutOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden z-10 animate-slide-up border border-slate-100 my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Guest Checkout</h2>
              <p className="text-xs text-slate-500">
                No password required &bull; Direct WhatsApp Order
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Step 1: Customer Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</span>
              Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Alex Morgan"
                    value={customer.name}
                    onChange={(e) => {
                      setCustomer({ ...customer, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }}
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border ${
                      errors.name ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                    } focus:border-emerald-500 outline-none transition-colors`}
                  />
                </div>
                {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  WhatsApp Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="e.g. +1 555 123 4567"
                    value={customer.phone}
                    onChange={(e) => {
                      setCustomer({ ...customer, phone: e.target.value });
                      if (errors.phone) setErrors({ ...errors, phone: null });
                    }}
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border ${
                      errors.phone ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                    } focus:border-emerald-500 outline-none transition-colors`}
                  />
                </div>
                {errors.phone && <p className="text-[11px] text-rose-500 mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address <span className="text-slate-400 font-normal">(Optional for receipts)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="alex@example.com"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Delivery Method Selection */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">2</span>
              Delivery & Fulfillment Method
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Shipping Option */}
              <label
                className={`relative flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  deliveryMethod === 'shipping'
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="shipping"
                  checked={deliveryMethod === 'shipping'}
                  onChange={() => setDeliveryMethod('shipping')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-sm text-slate-900">Home Shipping</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Delivered directly to your door with pin location.
                  </p>
                  <span className="inline-block mt-2 text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                    {deliveryFee === 0 ? 'FREE Shipping' : `${settings.currency}${settings.flatShippingFee.toFixed(2)} Flat Rate`}
                  </span>
                </div>
              </label>

              {/* Store Pickup Option */}
              <label
                className={`relative flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  deliveryMethod === 'pickup'
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="pickup"
                  checked={deliveryMethod === 'pickup'}
                  onChange={() => setDeliveryMethod('pickup')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-sm text-slate-900">Store Pickup</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Pick up in person at our local store hub.
                  </p>
                  <span className="inline-block mt-2 text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                    FREE Pickup
                  </span>
                </div>
              </label>

            </div>

            {/* If Shipping Selected: Address Fields + Map Location Picker */}
            {deliveryMethod === 'shipping' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 animate-fade-in mt-3">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Street Address / House / Flat No. <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 104 Ocean Avenue, Apt 4B"
                      value={shippingAddress.street}
                      onChange={(e) => {
                        setShippingAddress({ ...shippingAddress, street: e.target.value });
                        if (errors.street) setErrors({ ...errors, street: null });
                      }}
                      className={`w-full px-3 py-2 text-sm rounded-xl border ${
                        errors.street ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                      } bg-white focus:border-emerald-500 outline-none`}
                    />
                    {errors.street && <p className="text-[11px] text-rose-500 mt-1">{errors.street}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        City <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="San Francisco"
                        value={shippingAddress.city}
                        onChange={(e) => {
                          setShippingAddress({ ...shippingAddress, city: e.target.value });
                          if (errors.city) setErrors({ ...errors, city: null });
                        }}
                        className={`w-full px-3 py-2 text-sm rounded-xl border ${
                          errors.city ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                        } bg-white focus:border-emerald-500 outline-none`}
                      />
                      {errors.city && <p className="text-[11px] text-rose-500 mt-1">{errors.city}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        State / Province <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="CA"
                        value={shippingAddress.state}
                        onChange={(e) => {
                          setShippingAddress({ ...shippingAddress, state: e.target.value });
                          if (errors.state) setErrors({ ...errors, state: null });
                        }}
                        className={`w-full px-3 py-2 text-sm rounded-xl border ${
                          errors.state ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                        } bg-white focus:border-emerald-500 outline-none`}
                      />
                      {errors.state && <p className="text-[11px] text-rose-500 mt-1">{errors.state}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Postal / ZIP <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="94107"
                        value={shippingAddress.postalCode}
                        onChange={(e) => {
                          setShippingAddress({ ...shippingAddress, postalCode: e.target.value });
                          if (errors.postalCode) setErrors({ ...errors, postalCode: null });
                        }}
                        className={`w-full px-3 py-2 text-sm rounded-xl border ${
                          errors.postalCode ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                        } bg-white focus:border-emerald-500 outline-none`}
                      />
                      {errors.postalCode && <p className="text-[11px] text-rose-500 mt-1">{errors.postalCode}</p>}
                    </div>
                  </div>
                </div>

                {/* Interactive Map Picker */}
                <div className="pt-2 border-t border-slate-200/70">
                  <LocationPicker
                    coordinates={shippingAddress.coordinates}
                    onChange={(coords) => setShippingAddress({ ...shippingAddress, coordinates: coords })}
                  />
                </div>
              </div>
            )}

            {/* If Store Pickup Selected */}
            {deliveryMethod === 'pickup' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 animate-fade-in mt-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{settings.storeName} Hub</h4>
                    <p className="text-xs text-slate-600 mt-0.5">{settings.storeAddress}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {settings.storeHours}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 text-xs text-amber-900">
                  <span className="font-bold">📢 Important Pickup Notice:</span>
                  <p className="mt-0.5">
                    "Your pickup time will be informed via WhatsApp once your order is placed."
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Payment Notice (No Online Payment Step Required) */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900">
              <span className="font-bold">No Online Card / Payment Required Now:</span>
              <p className="text-emerald-800/90 mt-0.5">
                Pay conveniently with Cash on Delivery or via WhatsApp transfer after our team confirms your order details with you.
              </p>
            </div>
          </div>

          {/* Order Summary breakdown */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between font-medium text-slate-600">
              <span>Items ({cartItems.reduce((a, b) => a + b.quantity, 0)})</span>
              <span>{settings.currency}{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium text-slate-600">
              <span>Delivery Fee ({deliveryMethod === 'shipping' ? 'Shipping' : 'Pickup'})</span>
              <span>{deliveryFee === 0 ? 'FREE' : `${settings.currency}${deliveryFee.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Payable</span>
              <span className="text-emerald-700 text-base">{settings.currency}{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* WhatsApp Preview Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowPreviewMessage(!showPreviewMessage)}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {showPreviewMessage ? 'Hide WhatsApp Message Preview' : '👁️ Preview WhatsApp Message that will be sent'}
            </button>

            {showPreviewMessage && (
              <div className="mt-2.5 p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl whitespace-pre-wrap leading-relaxed shadow-inner overflow-x-auto max-h-48">
                {previewMessageText}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer / Place Order Button */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-white sticky bottom-0 z-20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-xs text-slate-500">Total Amount:</span>
            <div className="text-xl font-black text-slate-900">
              {settings.currency}{grandTotal.toFixed(2)}
            </div>
          </div>

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            className="w-full sm:w-auto flex-1 sm:max-w-xs flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3.5 px-6 rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/25 active:scale-98"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Order...</span>
              </div>
            ) : (
              <>
                <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                <span>Place Order via WhatsApp</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
