import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Check, 
  Save, 
  Navigation, 
  ChevronRight, 
  FileText, 
  Globe, 
  Bell, 
  PhoneCall, 
  HelpCircle, 
  ShieldCheck, 
  FileCheck2, 
  LogOut, 
  Pencil, 
  ArrowLeft,
  MessageCircle,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { LocationPicker } from './LocationPicker';
import { upsertStoreCustomerProfile } from '../services/supabase';

export const CustomerProfileModal = () => {
  const { isProfileOpen, setIsProfileOpen, currentCustomer, customer, updateProfile, setIsOrdersOpen, logout } = useAuth();
  const { showToast } = useToast();
  const { settings } = useSettings();

  const activeCustomer = currentCustomer || customer;

  // View state: 'hub' (iOS grouped card menu) | 'address' (Address & GPS editor) | 'about' | 'privacy' | 'terms' | 'help'
  const [activeTab, setActiveTab] = useState('hub');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [gpsCoords, setGpsCoords] = useState({ lat: 28.6139, lng: 77.2090 });
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (activeCustomer) {
      setName(activeCustomer.fullName || activeCustomer.name || '');
      setEmail(activeCustomer.email || '');
      setAddress(activeCustomer.address || activeCustomer.shippingAddress?.street || '');
      setCity(activeCustomer.city || activeCustomer.shippingAddress?.city || '');
      setState(activeCustomer.state || activeCustomer.shippingAddress?.state || '');
      setPostalCode(activeCustomer.postalCode || activeCustomer.shippingAddress?.postalCode || '');
      setGpsCoords({
        lat: activeCustomer.gpsLat || activeCustomer.shippingAddress?.coordinates?.lat || 28.6139,
        lng: activeCustomer.gpsLng || activeCustomer.shippingAddress?.coordinates?.lng || 77.2090
      });
    }
  }, [activeCustomer, isProfileOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isProfileOpen) {
        if (activeTab !== 'hub') {
          setActiveTab('hub');
        } else {
          setIsProfileOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProfileOpen, setIsProfileOpen, activeTab]);

  if (!isProfileOpen) return null;

  const closeModal = () => {
    setIsProfileOpen(false);
    setActiveTab('hub');
  };

  // 📍 Use Current GPS Location handler
  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      showToast('GPS not supported on your device', 'error');
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setGpsCoords(coords);
        setIsLocating(false);
        showToast(`📍 GPS Captured: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`, 'success');
      },
      (err) => {
        setIsLocating(false);
        showToast('Please allow location access in your browser', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Save profile to Supabase & localStorage
  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    if (!name.trim()) {
      showToast('Please enter your full name', 'warning');
      return;
    }

    try {
      await upsertStoreCustomerProfile({
        phone: activeCustomer?.phone || '',
        fullName: name,
        name: name,
        email: email,
        address: address,
        city: city,
        state: state,
        postalCode: postalCode,
        gpsLat: gpsCoords.lat,
        gpsLng: gpsCoords.lng
      });

      if (updateProfile) {
        updateProfile({
          fullName: name,
          name: name,
          email: email,
          address: address,
          city: city,
          state: state,
          postalCode: postalCode,
          coordinates: gpsCoords
        });
      }

      showToast('Address & GPS delivery location saved successfully!', 'success');
      setActiveTab('hub');
    } catch (err) {
      showToast('Failed to save profile', 'error');
    }
  };

  const displayName = activeCustomer?.fullName || activeCustomer?.name || 'Customer';
  const displayPhone = activeCustomer?.phone ? `+91 ${activeCustomer.phone}` : '+91 98765 43210';
  const displayEmail = activeCustomer?.email || 'customer@xyvot.com';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={closeModal}
      />

      {/* Modern iOS-Style Grouped Card Drawer / Modal */}
      <div className="relative bg-[#F8F9FA] rounded-t-[32px] sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden z-10 animate-slide-up border-t sm:border border-slate-200/90 flex flex-col max-h-[92vh]">
        
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Top Navigation Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeTab !== 'hub' && (
              <button
                type="button"
                onClick={() => setActiveTab('hub')}
                className="p-1.5 -ml-2 rounded-full hover:bg-slate-200/60 text-slate-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {activeTab === 'hub' && 'Profile'}
              {activeTab === 'address' && 'Address Book'}
              {activeTab === 'help' && 'Get Help & FAQs'}
              {activeTab === 'privacy' && 'Privacy Policy'}
              {activeTab === 'terms' && 'Terms & Conditions'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="px-5 sm:px-6 pb-8 overflow-y-auto space-y-4">
          
          {/* ===================== VIEW 1: MAIN IOS GROUPED HUB ===================== */}
          {activeTab === 'hub' && (
            <div className="space-y-4 animate-fade-in">
              
              {/* 1. Customer Info Profile Card */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-xl shadow-xs flex-shrink-0 border-2 border-white">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-slate-900 text-base">
                      {displayName}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      {displayPhone}
                    </p>
                    {activeCustomer?.email && (
                      <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {activeCustomer.email}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('address')}
                  title="Edit Address & Profile"
                  className="p-2.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {/* 2. Grouped Card: Account & Orders */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs divide-y divide-slate-100 overflow-hidden">
                
                {/* Address Book */}
                <button
                  type="button"
                  onClick={() => setActiveTab('address')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:text-slate-900">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Address Book</p>
                      <p className="text-[11px] text-slate-400">
                        {address ? `${address.slice(0, 32)}...` : 'Manage your saved addresses & GPS'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                </button>

                {/* Order History */}
                <button
                  type="button"
                  onClick={() => {
                    closeModal();
                    setIsOrdersOpen(true);
                  }}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:text-slate-900">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Order History</p>
                      <p className="text-[11px] text-slate-400">View your past orders & invoices</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                </button>

                {/* Language */}
                <div className="px-4 py-3.5 flex items-center justify-between text-left">
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Language</p>
                      <p className="text-[11px] text-slate-400">English (India)</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">English</span>
                </div>

                {/* Notifications */}
                <div className="px-4 py-3.5 flex items-center justify-between text-left">
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Notifications</p>
                      <p className="text-[11px] text-slate-400">Instant WhatsApp receipts enabled</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>

              </div>

              {/* 3. Grouped Card: Support, Legal & Store Info */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs divide-y divide-slate-100 overflow-hidden">
                
                {/* Contact Us */}
                <a
                  href={`https://wa.me/91${settings.whatsappNumber || '9147364980'}?text=${encodeURIComponent('Hi! I need help with my order on ' + settings.storeName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:text-emerald-600">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Contact Us</p>
                      <p className="text-[11px] text-slate-400">Direct WhatsApp support (+91 {settings.whatsappNumber || '9147364980'})</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                </a>

                {/* Get Help */}
                <button
                  type="button"
                  onClick={() => setActiveTab('help')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:text-slate-900">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Get Help</p>
                      <p className="text-[11px] text-slate-400">Cash on Delivery, shipping & FAQ</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                </button>

                {/* Privacy Policy */}
                <button
                  type="button"
                  onClick={() => setActiveTab('privacy')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:text-slate-900">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Privacy Policy</p>
                      <p className="text-[11px] text-slate-400">Customer security & data protection</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                </button>

                {/* Terms & Conditions */}
                <button
                  type="button"
                  onClick={() => setActiveTab('terms')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:text-slate-900">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Terms & Conditions</p>
                      <p className="text-[11px] text-slate-400">Store terms, billing & returns</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                </button>

              </div>

              {/* 4. Log Out Button */}
              {activeCustomer && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      closeModal();
                      showToast('Logged out successfully', 'info');
                    }}
                    className="w-full py-3.5 px-4 bg-white hover:bg-rose-50 border border-slate-100 rounded-2xl text-rose-600 text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer active:scale-98"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}

            </div>
          )}

          {/* ===================== VIEW 2: ADDRESS BOOK & GPS LOCATION ===================== */}
          {activeTab === 'address' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 animate-fade-in bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Recipient Information
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Oliva"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        WhatsApp Phone
                      </label>
                      <input
                        type="text"
                        value={activeCustomer?.phone ? `+91 ${activeCustomer.phone}` : '+91 '}
                        disabled
                        className="w-full px-3.5 py-2.5 text-xs font-mono font-medium rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed border border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="oliva@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Address Details */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Delivery Address
                  </h3>

                  {/* 📍 Use Current GPS Location Button */}
                  <button
                    type="button"
                    onClick={handleGetGpsLocation}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-black text-white text-[11px] font-semibold transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Locating...' : '📍 Use Current GPS'}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Street Address / Flat / Building
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 402 Green Meadows, 5th Main Road"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      placeholder="Mumbai"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      placeholder="Maharashtra"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      placeholder="400001"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Leaflet GPS Map Picker */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Pinpoint Location on Map:</span>
                    <span className="text-[10px] font-mono text-emerald-700">
                      {gpsCoords?.lat?.toFixed(4)}, {gpsCoords?.lng?.toFixed(4)}
                    </span>
                  </label>
                  <LocationPicker
                    coordinates={gpsCoords}
                    onChange={(coords) => setGpsCoords(coords)}
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('hub')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Address</span>
                </button>
              </div>

            </form>
          )}

          {/* ===================== VIEW 3: GET HELP & FAQS ===================== */}
          {activeTab === 'help' && (
            <div className="space-y-4 animate-fade-in bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-xs text-slate-700 leading-relaxed">
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-slate-900">How does Cash on Delivery (COD) work?</h3>
                <p className="text-slate-600">
                  Place your order with 1 click without paying upfront. Our delivery partner will collect the cash at your doorstep upon delivering your items.
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">How do I track my order?</h3>
                <p className="text-slate-600">
                  As soon as your order is placed, an automated WhatsApp receipt with your invoice number is dispatched to your registered mobile number. You can also view live order progress under <strong>Order History</strong>.
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Need urgent support?</h3>
                <p className="text-slate-600">
                  Our customer support team is available directly on WhatsApp at <strong>+91 {settings.whatsappNumber || '9147364980'}</strong>.
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('hub')}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors text-center"
                >
                  Back to Profile
                </button>
              </div>
            </div>
          )}

          {/* ===================== VIEW 4: PRIVACY POLICY ===================== */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-fade-in bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-xs text-slate-700 leading-relaxed">
              <h3 className="font-bold text-sm text-slate-900">Customer Data & Privacy</h3>
              <p className="text-slate-600">
                We respect your privacy. Your mobile phone number is solely used for WhatsApp OTP authentication, sending automated digital receipts, and dispatching order status updates.
              </p>
              <p className="text-slate-600">
                We never sell, rent, or share your personal information or GPS delivery coordinates with unauthorized third parties. All transactions and customer data are securely managed by the XYVOT Platform.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('hub')}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors text-center"
                >
                  Back to Profile
                </button>
              </div>
            </div>
          )}

          {/* ===================== VIEW 5: TERMS & CONDITIONS ===================== */}
          {activeTab === 'terms' && (
            <div className="space-y-4 animate-fade-in bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-xs text-slate-700 leading-relaxed">
              <h3 className="font-bold text-sm text-slate-900">Store Terms & Conditions</h3>
              <p className="text-slate-600">
                1. <strong>Cash on Delivery</strong>: By placing an order, you agree to accept delivery and pay the exact invoice amount to the delivery rider.
              </p>
              <p className="text-slate-600">
                2. <strong>Tax Invoices</strong>: Digital GST tax invoices are generated automatically and can be downloaded as PDF receipts anytime from the Order History page.
              </p>
              <p className="text-slate-600">
                3. <strong>Returns & Cancellations</strong>: Cancellations can be requested via WhatsApp before dispatch.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('hub')}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors text-center"
                >
                  Back to Profile
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
