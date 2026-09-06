import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Truck, 
  Store, 
  MapPin, 
  CheckCircle2, 
  MessageCircle, 
  AlertCircle, 
  ArrowLeft, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  Edit3,
  Check,
  Building2,
  CalendarCheck
} from 'lucide-react';
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
  const { currentCustomer, customer, setIsAuthOpen } = useAuth();

  const activeCustomer = currentCustomer || customer;

  // Delivery Method: 'shipping' (Home Delivery) | 'pickup' (Store Pickup)
  const [deliveryMethod, setDeliveryMethod] = useState('shipping');

  // Whether user is in "Edit Address" mode or "Saved Address" card mode
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Contact State (Initialized from active session)
  const [customerInfo, setCustomerInfo] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('customer_session') || localStorage.getItem('quickcart_customer_session') || '{}');
      return {
        name: saved.fullName || saved.name || saved.full_name || saved.customer_name || '',
        phone: saved.phone || '',
        email: saved.email || ''
      };
    } catch (e) {
      return { name: '', phone: '', email: '' };
    }
  });

  // Shipping Address State
  const [shippingAddress, setShippingAddress] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('customer_session') || localStorage.getItem('quickcart_customer_session') || '{}');
      return {
        street: saved.address || saved.shippingAddress?.street || '',
        city: saved.city || saved.shippingAddress?.city || 'Habra',
        state: saved.state || saved.shippingAddress?.state || 'West Bengal',
        postalCode: saved.postalCode || saved.shippingAddress?.postalCode || '743263',
        notes: saved.notes || '',
        coordinates: {
          lat: saved.gpsLat || saved.shippingAddress?.coordinates?.lat || 22.8291,
          lng: saved.gpsLng || saved.shippingAddress?.coordinates?.lng || 88.6148
        }
      };
    } catch (e) {
      return {
        street: '',
        city: 'Habra',
        state: 'West Bengal',
        postalCode: '743263',
        notes: '',
        coordinates: { lat: 22.8291, lng: 88.6148 }
      };
    }
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingPickupPerson, setIsEditingPickupPerson] = useState(false);

  // Sync with customer auth profile
  useEffect(() => {
    let cust = activeCustomer;
    if (!cust) {
      try {
        cust = JSON.parse(localStorage.getItem('customer_session') || localStorage.getItem('quickcart_customer_session') || '{}');
      } catch (e) {}
    }

    if (cust && (cust.fullName || cust.name || cust.full_name || cust.customer_name || cust.phone)) {
      const custName = cust.fullName || cust.name || cust.full_name || cust.customer_name || '';
      const custPhone = cust.phone || '';
      const custEmail = cust.email || '';
      const custStreet = cust.address || cust.shippingAddress?.street || '';
      const custCity = cust.city || cust.shippingAddress?.city || 'Habra';
      const custState = cust.state || cust.shippingAddress?.state || 'West Bengal';
      const custPincode = cust.postalCode || cust.shippingAddress?.postalCode || '743263';
      const custLat = cust.gpsLat || cust.shippingAddress?.coordinates?.lat || 22.8291;
      const custLng = cust.gpsLng || cust.shippingAddress?.coordinates?.lng || 88.6148;

      setCustomerInfo((prev) => ({
        name: custName || prev.name || '',
        phone: custPhone || prev.phone || '',
        email: custEmail || prev.email || ''
      }));

      setShippingAddress((prev) => ({
        street: custStreet || prev.street || '',
        city: custCity || prev.city || 'Habra',
        state: custState || prev.state || 'West Bengal',
        postalCode: custPincode || prev.postalCode || '743263',
        notes: cust.notes || prev.notes || '',
        coordinates: {
          lat: custLat || prev.coordinates.lat || 22.8291,
          lng: custLng || prev.coordinates.lng || 88.6148
        }
      }));

      // If user has saved name and address, default to clean saved-address view
      if (custName && custStreet) {
        setIsEditingAddress(false);
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

  const hasSavedProfile = Boolean(
    activeCustomer && 
    customerInfo.name.trim() && 
    customerInfo.phone.trim() && 
    shippingAddress.street.trim()
  );

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

  const handlePlaceCodOrder = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fill in all required delivery details', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Format order payload
      const orderPayload = {
        customer_name: customerInfo.name.trim(),
        customer_phone: customerInfo.phone.trim(),
        customer_email: customerInfo.email.trim() || null,
        delivery_address: deliveryMethod === 'shipping' 
          ? `${shippingAddress.street.trim()}, ${shippingAddress.city.trim()}, ${shippingAddress.postalCode.trim()}`
          : `Store Pickup: ${settings.storeName || 'Ganapati Store'} (${settings.storeAddress || 'Main Market Road, Habra, West Bengal 743263'})`,
        gps_lat: deliveryMethod === 'shipping' ? shippingAddress.coordinates.lat : 22.8291,
        gps_lng: deliveryMethod === 'shipping' ? shippingAddress.coordinates.lng : 88.6148,
        deliveryMethod: deliveryMethod,
        channel: 'website',
        payment_method: deliveryMethod === 'shipping' ? 'Cash on Delivery (COD)' : 'Pay on Store Pickup (COD)',
        payment_gateway: 'Cash on Delivery (COD)',
        status: 'pending_cod',
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        total_amount: grandTotal,
        items: cartItems.map((item) => ({
          id: item.id,
          product_name: item.title || item.name,
          title: item.title || item.name,
          variant_name: item.selectedVariant ? item.selectedVariant.name || item.selectedVariant.size : null,
          unit_price: parseFloat(item.price || 0),
          price: parseFloat(item.price || 0),
          quantity: parseInt(item.quantity, 10),
          image: item.image || item.image_url || null
        }))
      };

      // 2. Submit order to Supabase backend API
      const result = await submitStoreApiOrder(STORE_API_KEY, orderPayload);

      if (result.status === 201 || result.success) {
        const placedOrder = result.order || {
          ...orderPayload,
          orderId: result.invoice_number,
          invoice_number: result.invoice_number,
          createdAt: new Date().toISOString()
        };

        // 3. Save / Update customer profile in background for future 1-click checkouts
        if (deliveryMethod === 'shipping') {
          upsertStoreCustomerProfile({
            phone: customerInfo.phone.trim(),
            fullName: customerInfo.name.trim(),
            email: customerInfo.email.trim(),
            address: shippingAddress.street.trim(),
            city: shippingAddress.city.trim(),
            state: shippingAddress.state.trim(),
            postalCode: shippingAddress.postalCode.trim(),
            gpsLat: shippingAddress.coordinates.lat,
            gpsLng: shippingAddress.coordinates.lng,
          }).catch(console.warn);
        }

        // 4. Trigger celebration confetti
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 }
        });

        // 5. Clear cart and notify
        clearCart();
        setIsCheckoutOpen(false);
        showToast('Order placed successfully! Redirecting...', 'success');

        if (onOrderSuccess) {
          onOrderSuccess({
            ...placedOrder,
            deliveryMethod: deliveryMethod,
            storeAddress: settings.storeAddress || 'Main Market Road, Habra, West Bengal 743263',
            storeName: settings.storeName || 'Ganapati Store'
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
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => setIsCheckoutOpen(false)}
      />

      {/* Slide-over Right Side Panel Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto">
        <div className="w-full sm:w-screen sm:max-w-md bg-white shadow-2xl flex flex-col animate-slide-left border-l border-slate-200/90 h-full">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between bg-white sticky top-0 z-20">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200/80">
                <Truck className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Checkout & Dispatch
                </h2>
                <p className="text-xs text-slate-500">
                  Direct WhatsApp Store Dispatch &bull; Cash on Delivery
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Method Switcher Tabs */}
          <div className="px-4 sm:px-6 pt-4 pb-2 bg-white border-b border-slate-200/70">
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200/60">
              <button
                type="button"
                onClick={() => setDeliveryMethod('shipping')}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  deliveryMethod === 'shipping'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Home Delivery</span>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod('pickup')}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  deliveryMethod === 'pickup'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Store Pickup</span>
              </button>
            </div>
          </div>

          {/* Scrollable Form Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
            
            {/* OPTION A: HOME DELIVERY */}
            {deliveryMethod === 'shipping' && (
              <>
                {/* Same-Day Delivery Guarantee Banner */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 uppercase tracking-wide">
                      <span>⚡ Delivery Expected Today</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Your order will be packed fresh and delivered to your doorstep today by <strong>{settings.storeName || 'Ganapati Store'}</strong>.
                    </p>
                  </div>
                </div>

                {/* 1-Click Saved Profile Card (if available and not currently editing) */}
                {hasSavedProfile && !isEditingAddress ? (
                  <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200/60">
                          <Check className="w-3 h-3 text-slate-800 stroke-[3]" />
                          <span>Saved Delivery Address</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/60 transition-colors cursor-pointer active:scale-95"
                      >
                        <Edit3 className="w-3 h-3 text-slate-600" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{customerInfo.name}</span>
                        <span className="font-semibold text-slate-600">+91 {customerInfo.phone}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed pt-1 font-medium">
                        {shippingAddress.street}
                      </p>
                      <p className="text-slate-500 font-medium">
                        {shippingAddress.city}, {shippingAddress.state} - <strong className="text-slate-800">{shippingAddress.postalCode}</strong>
                      </p>
                      {customerInfo.email && (
                        <p className="text-slate-400 text-[11px] pt-0.5">{customerInfo.email}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Editable Contact & Address Form */
                  <div className="space-y-4">
                    {/* Header if editing saved address */}
                    {hasSavedProfile && (
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Edit Delivery Address
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingAddress(false)}
                          className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Step 1: Customer Contact Info */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px]">1</span>
                          Contact Information
                        </h3>
                        {!activeCustomer && (
                          <button
                            type="button"
                            onClick={() => setIsAuthOpen(true)}
                            className="text-[11px] font-bold text-slate-900 hover:underline cursor-pointer"
                          >
                            Login with WhatsApp
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Full Name <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="e.g. Bishal Mistri"
                              value={customerInfo.name}
                              onChange={(e) => {
                                setCustomerInfo({ ...customerInfo, name: e.target.value });
                                if (errors.name) setErrors({ ...errors, name: null });
                              }}
                              className={`w-full pl-9 pr-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border outline-none transition-all ${
                                errors.name ? 'border-rose-400 bg-rose-50/40' : 'border-transparent focus:border-slate-400 focus:bg-white'
                              }`}
                            />
                          </div>
                          {errors.name && <span className="text-[10px] text-rose-500 font-medium">{errors.name}</span>}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            WhatsApp Number <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="tel"
                              placeholder="98765 43210"
                              value={customerInfo.phone}
                              onChange={(e) => {
                                setCustomerInfo({ ...customerInfo, phone: e.target.value.replace(/\D/g, '') });
                                if (errors.phone) setErrors({ ...errors, phone: null });
                              }}
                              className={`w-full pl-9 pr-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border outline-none transition-all ${
                                errors.phone ? 'border-rose-400 bg-rose-50/40' : 'border-transparent focus:border-slate-400 focus:bg-white'
                              }`}
                            />
                          </div>
                          {errors.phone && <span className="text-[10px] text-rose-500 font-medium">{errors.phone}</span>}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="email"
                            placeholder="e.g. bishal@example.com"
                            value={customerInfo.email}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                            className="w-full pl-9 pr-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Delivery Address & Map Pin */}
                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px]">2</span>
                        Delivery Address & GPS Map Pin
                      </h3>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Street Address / House / Flat <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Flat 402, Green Valley Apartments, Station Road"
                          value={shippingAddress.street}
                          onChange={(e) => {
                            setShippingAddress({ ...shippingAddress, street: e.target.value });
                            if (errors.street) setErrors({ ...errors, street: null });
                          }}
                          className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border outline-none transition-all ${
                            errors.street ? 'border-rose-400 bg-rose-50/40' : 'border-transparent focus:border-slate-400 focus:bg-white'
                          }`}
                        />
                        {errors.street && <span className="text-[10px] text-rose-500 font-medium">{errors.street}</span>}
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            City <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Habra"
                            value={shippingAddress.city}
                            onChange={(e) => {
                              setShippingAddress({ ...shippingAddress, city: e.target.value });
                              if (errors.city) setErrors({ ...errors, city: null });
                            }}
                            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                          <input
                            type="text"
                            placeholder="West Bengal"
                            value={shippingAddress.state}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Pincode <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="743263"
                            value={shippingAddress.postalCode}
                            onChange={(e) => {
                              setShippingAddress({ ...shippingAddress, postalCode: e.target.value.replace(/\D/g, '') });
                              if (errors.postalCode) setErrors({ ...errors, postalCode: null });
                            }}
                            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* GPS Pinpoint Map */}
                      <div>
                        <LocationPicker
                          coordinates={shippingAddress.coordinates}
                          onChange={(coords) => setShippingAddress({ ...shippingAddress, coordinates: coords })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* OPTION B: STORE PICKUP */}
            {deliveryMethod === 'pickup' && (
              <div className="space-y-4">
                {/* Store Pickup Notice Banner */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 uppercase tracking-wide">
                      <span>Pickup Time Notice</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Your pickup time will be confirmed by the store in <strong>My Orders</strong> right after placing the order.
                    </p>
                  </div>
                </div>

                {/* Store Physical Location Card */}
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Building2 className="w-4 h-4 text-slate-900" />
                    <span>{settings.storeName || 'Ganapati Store'} Hub</span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 pl-6">
                    <p className="font-semibold text-slate-800">
                      {settings.storeAddress || 'Main Market Road, Habra, West Bengal 743263'}
                    </p>
                    <p className="text-slate-500">
                      Store Hours: {settings.storeHours || 'Mon - Sun: 8:00 AM - 9:00 PM'}
                    </p>
                    <p className="text-slate-500">
                      WhatsApp Support: {settings.whatsappNumber || '+91 9147364980'}
                    </p>
                  </div>
                </div>

                {/* Pickup Customer Contact Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px]">1</span>
                      Pickup Person Details
                    </h3>

                    {customerInfo.name && !isEditingPickupPerson && (
                      <button
                        type="button"
                        onClick={() => setIsEditingPickupPerson(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/60 transition-colors cursor-pointer active:scale-95"
                      >
                        <Edit3 className="w-3 h-3 text-slate-600" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {customerInfo.name && !isEditingPickupPerson ? (
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{customerInfo.name}</span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200/60 text-[10px] font-bold">
                            <Check className="w-3 h-3 text-slate-800" />
                            <span>Profile Contact</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">+91 {customerInfo.phone}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerInfo.name && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setIsEditingPickupPerson(false)}
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Full Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Bishal Mistri"
                            value={customerInfo.name}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            WhatsApp Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="tel"
                            placeholder="98765 43210"
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value.replace(/\D/g, '') })}
                            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Method Notice */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">
                  {deliveryMethod === 'shipping' ? 'Payment Method: Cash on Delivery (COD)' : 'Payment Method: Pay at Store on Pickup'}
                </span>
                <span className="text-slate-600 text-[11px] leading-relaxed">
                  Pay with cash or UPI upon {deliveryMethod === 'shipping' ? 'doorstep delivery' : 'store pickup'}. 100% verified & secure.
                </span>
              </div>
            </div>

            {/* Order Items & Cost Breakdown */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal ({cartItems.length})</span>
                <span className="font-semibold text-slate-900">{settings.currency}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (18% inclusive)</span>
                <span className="font-semibold text-slate-900">{settings.currency}{((subtotal * 0.18) / 1.18).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{deliveryMethod === 'shipping' ? 'Delivery Fee' : 'Store Pickup'}</span>
                <span className="font-bold text-slate-900">
                  {deliveryFee === 0 ? 'FREE' : `${settings.currency}${deliveryFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Payable ({deliveryMethod === 'shipping' ? 'COD' : 'Pickup'})</span>
                <span className="text-slate-900 text-base">{settings.currency}{grandTotal.toFixed(2)}</span>
              </div>
            </div>

          </div>

          {/* Drawer Sticky Footer / Place Order Button */}
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-white sticky bottom-0 z-20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Total Payable ({deliveryMethod === 'shipping' ? 'COD' : 'Pickup'}):
              </span>
              <div className="text-xl font-black text-slate-900">
                {settings.currency}{grandTotal.toFixed(2)}
              </div>
            </div>

            <button
              type="button"
              onClick={handlePlaceCodOrder}
              disabled={isSubmitting}
              className="w-full sm:w-auto flex-1 sm:max-w-xs flex items-center justify-center gap-2 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-bold py-3.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Placing Order...</span>
                </div>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 fill-white text-slate-900" />
                  <span>Place Cash on Delivery Order</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
