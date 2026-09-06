import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Truck, Store, MapPin, CheckCircle2, MessageCircle, AlertCircle, ArrowLeft, ShieldCheck, Clock, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { LocationPicker } from './LocationPicker';
import { formatWhatsAppMessage, buildWhatsAppUrl } from '../services/orderService';
import { submitStoreApiOrder, STORE_API_KEY, upsertStoreCustomerProfile } from '../services/supabase';

export const CheckoutModal = ({ onOrderSuccess }) => {
  const { isCheckoutOpen, setIsCheckoutOpen, cartItems, subtotal, clearCart } = useCart();
  const { settings } = useSettings();
  const { showToast } = useToast();
  const { currentCustomer, customer, updateProfile } = useAuth();

  const activeCustomer = currentCustomer || customer;

  const [deliveryMethod, setDeliveryMethod] = useState('shipping'); // 'shipping' | 'pickup'

  // Contact State (Pre-filled from auth profile if available)
  const [customerInfo, setCustomerInfo] = useState({
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
    notes: '',
    coordinates: { lat: 28.6139, lng: 77.2090 }
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync with customer auth profile
  useEffect(() => {
    if (activeCustomer) {
      setCustomerInfo({
        name: activeCustomer.fullName || activeCustomer.name || '',
        phone: activeCustomer.phone || '',
        email: activeCustomer.email || ''
      });
      if (activeCustomer.shippingAddress || activeCustomer.address) {
        setShippingAddress({
          street: activeCustomer.address || activeCustomer.shippingAddress?.street || '',
          city: activeCustomer.city || activeCustomer.shippingAddress?.city || '',
          state: activeCustomer.state || activeCustomer.shippingAddress?.state || '',
          postalCode: activeCustomer.postalCode || activeCustomer.shippingAddress?.postalCode || '',
          notes: activeCustomer.notes || activeCustomer.shippingAddress?.notes || '',
          coordinates: {
            lat: activeCustomer.gpsLat || activeCustomer.shippingAddress?.coordinates?.lat || 28.6139,
            lng: activeCustomer.gpsLng || activeCustomer.shippingAddress?.coordinates?.lng || 77.2090
          }
        });
      }
    }
  }, [activeCustomer, isCheckoutOpen]);

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
    if (!customerInfo.name.trim()) errs.name = 'Full name is required';
    if (!customerInfo.phone.trim()) {
      errs.phone = 'WhatsApp phone number is required';
    } else if (customerInfo.phone.trim().length < 10) {
      errs.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (deliveryMethod === 'shipping') {
      if (!shippingAddress.street.trim()) errs.street = 'Street address / Flat is required';
      if (!shippingAddress.city.trim()) errs.city = 'City is required';
      if (!shippingAddress.postalCode.trim()) errs.postalCode = 'Pincode is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /**
   * 3. COD Checkout Submission
   */
  const handlePlaceCodOrder = async () => {
    if (!validate()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (cartItems.length === 0) {
      showToast('Your cart is empty', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const fullDeliveryAddress = deliveryMethod === 'shipping'
        ? `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state || ''} ${shippingAddress.postalCode || ''}`.trim()
        : 'Store Pickup';

      const orderPayload = {
        customer_name: customerInfo.name || activeCustomer?.fullName || 'Website Customer',
        customer_phone: customerInfo.phone || activeCustomer?.phone || '',
        customer_email: customerInfo.email || activeCustomer?.email || '',
        delivery_address: fullDeliveryAddress,
        gps_lat: shippingAddress.coordinates?.lat || activeCustomer?.gpsLat || 28.6139,
        gps_lng: shippingAddress.coordinates?.lng || activeCustomer?.gpsLng || 77.2090,
        channel: 'website',
        payment_gateway: 'Cash on Delivery (COD)',
        total_amount: grandTotal,
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        items: cartItems.map((item) => {
          const vLabel = item.variantName || (item.selectedVariant ? (item.selectedVariant.name || item.selectedVariant.size) : null);
          const vId = item.variantId || item.selectedVariant?.id || null;
          const vSku = item.sku || item.selectedVariant?.sku || '';
          const itemName = vLabel ? `${item.title || item.name} (${vLabel})` : (item.title || item.name);
          return {
            id: item.id,
            product_id: item.id,
            variant_id: vId,
            variant_name: vLabel,
            sku: vSku,
            name: itemName,
            product_name: itemName,
            price: item.price,
            unit_price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
            image: item.image || item.imageUrl || ''
          };
        })
      };

      // Call submitStoreApiOrder with STORE_API_KEY
      const result = await submitStoreApiOrder(STORE_API_KEY, orderPayload);

      if (result.status === 201 || result.success) {
        // 1. Order immediately appears in Admin POS > Online Orders
        // 2. Automated WhatsApp confirmation is sent to customer
        
        // Save/Update customer profile preferences if logged in
        if (activeCustomer) {
          try {
            await upsertStoreCustomerProfile({
              phone: customerInfo.phone,
              fullName: customerInfo.name,
              name: customerInfo.name,
              email: customerInfo.email,
              address: shippingAddress.street,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postalCode: shippingAddress.postalCode,
              gpsLat: shippingAddress.coordinates?.lat,
              gpsLng: shippingAddress.coordinates?.lng
            });
          } catch (e) {}
        }

        // Trigger Confetti celebration
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}

        const placedOrder = result.order;

        clearCart();
        setIsCheckoutOpen(false);

        // Show Success Modal with order details
        if (onOrderSuccess) {
          onOrderSuccess({
            order: placedOrder,
            placedOrder: placedOrder
          });
        }
      }
    } catch (err) {
      console.error('Order placement error:', err);
      showToast('Failed to place order: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => setIsCheckoutOpen(false)}
      />

      {/* Modal Card - Modern White Minimalist */}
      <div className="relative bg-white rounded shadow-2xl max-w-2xl w-full overflow-hidden z-10 animate-slide-up border border-slate-200/90 my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Truck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Cash on Delivery (COD) Checkout
              </h2>
              <p className="text-xs text-slate-500">
                Direct WhatsApp Dispatch &bull; Pay cash or UPI upon delivery
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Step 1: Customer Contact Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px]">1</span>
              Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={customerInfo.name}
                    onChange={(e) => {
                      setCustomerInfo({ ...customerInfo, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }}
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded border ${
                      errors.name ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                    } focus:border-emerald-600 outline-none`}
                  />
                </div>
                {errors.name && <p className="text-[10px] text-rose-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    maxLength={10}
                    value={customerInfo.phone}
                    onChange={(e) => {
                      setCustomerInfo({ ...customerInfo, phone: e.target.value.replace(/\D/g, '') });
                      if (errors.phone) setErrors({ ...errors, phone: null });
                    }}
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded border ${
                      errors.phone ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                    } focus:border-emerald-600 outline-none`}
                  />
                </div>
                {errors.phone && <p className="text-[10px] text-rose-500 mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address <span className="text-slate-400 font-normal">(Optional for tax invoice PDF)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="rahul@example.com"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded border border-slate-300 focus:border-emerald-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Delivery Method & GPS Map Location */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px]">2</span>
              Delivery Address & GPS Map Pin
            </h3>

            <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Street Address / House / Flat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 402, Green Valley Apartments"
                  value={shippingAddress.street}
                  onChange={(e) => {
                    setShippingAddress({ ...shippingAddress, street: e.target.value });
                    if (errors.street) setErrors({ ...errors, street: null });
                  }}
                  className={`w-full px-3 py-2 text-xs rounded border ${
                    errors.street ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                  } bg-white focus:border-emerald-600 outline-none`}
                />
                {errors.street && <p className="text-[10px] text-rose-500 mt-1">{errors.street}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Mumbai"
                    value={shippingAddress.city}
                    onChange={(e) => {
                      setShippingAddress({ ...shippingAddress, city: e.target.value });
                      if (errors.city) setErrors({ ...errors, city: null });
                    }}
                    className="w-full px-3 py-2 text-xs rounded border border-slate-300 bg-white focus:border-emerald-600 outline-none"
                  />
                  {errors.city && <p className="text-[10px] text-rose-500 mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="Maharashtra"
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded border border-slate-300 bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pincode <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="400001"
                    value={shippingAddress.postalCode}
                    onChange={(e) => {
                      setShippingAddress({ ...shippingAddress, postalCode: e.target.value });
                      if (errors.postalCode) setErrors({ ...errors, postalCode: null });
                    }}
                    className="w-full px-3 py-2 text-xs rounded border border-slate-300 bg-white focus:border-emerald-600 outline-none"
                  />
                  {errors.postalCode && <p className="text-[10px] text-rose-500 mt-1">{errors.postalCode}</p>}
                </div>
              </div>

              {/* Leaflet GPS Map with Locate Me Button */}
              <div className="pt-2 border-t border-slate-200">
                <LocationPicker
                  coordinates={shippingAddress.coordinates}
                  onChange={(coords) => setShippingAddress({ ...shippingAddress, coordinates: coords })}
                />
              </div>
            </div>
          </div>

          {/* Payment Method Notice: Cash on Delivery */}
          <div className="p-3.5 rounded bg-emerald-50/80 border border-emerald-200 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950">
              <span className="font-black uppercase tracking-wider">Payment Method: Cash on Delivery (COD)</span>
              <p className="text-emerald-800/90 mt-0.5 leading-relaxed">
                Pay with cash or UPI upon delivery at your doorstep. No advance card payments or passwords needed.
              </p>
            </div>
          </div>

          {/* Order Pricing Breakdown */}
          <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal ({cartItems.reduce((a, b) => a + b.quantity, 0)})</span>
              <span className="font-semibold text-slate-900">{settings.currency}{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST (18% inclusive)</span>
              <span className="font-semibold text-slate-900">{settings.currency}{((subtotal * 0.18) / 1.18).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>COD Delivery Fee</span>
              <span className="font-bold text-emerald-700">
                {deliveryFee === 0 ? 'FREE' : `${settings.currency}${deliveryFee.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Payable on Delivery</span>
              <span className="text-emerald-700 text-base">{settings.currency}{grandTotal.toFixed(2)}</span>
            </div>
          </div>

        </div>

        {/* Modal Footer / Place Order Button */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white sticky bottom-0 z-20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Payable (COD):</span>
            <div className="text-xl font-black text-slate-900">
              {settings.currency}{grandTotal.toFixed(2)}
            </div>
          </div>

          <button
            type="button"
            onClick={handlePlaceCodOrder}
            disabled={isSubmitting}
            className="w-full sm:w-auto flex-1 sm:max-w-xs flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3 px-5 rounded text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 active:scale-98 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Placing COD Order...</span>
              </div>
            ) : (
              <>
                <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                <span>Place Cash on Delivery Order</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
