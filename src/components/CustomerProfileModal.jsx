import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Check, Save, Navigation } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LocationPicker } from './LocationPicker';
import { upsertStoreCustomerProfile } from '../services/supabase';

export const CustomerProfileModal = () => {
  const { isProfileOpen, setIsProfileOpen, currentCustomer, customer, updateProfile } = useAuth();
  const { showToast } = useToast();

  const activeCustomer = currentCustomer || customer;

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
      if (e.key === 'Escape' && isProfileOpen) setIsProfileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProfileOpen, setIsProfileOpen]);

  if (!isProfileOpen) return null;

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
        showToast(`📍 GPS Location Captured: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`, 'success');
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

      showToast('Profile & GPS delivery location saved successfully!', 'success');
      setIsProfileOpen(false);
    } catch (err) {
      showToast('Failed to save profile', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => setIsProfileOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded shadow-2xl max-w-xl w-full overflow-hidden z-10 animate-slide-up border border-slate-200/90 my-auto flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Profile & GPS Delivery Address
              </h2>
              <p className="text-xs text-slate-500">
                Set your default delivery address and GPS pin for 1-click COD orders.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsProfileOpen(false)}
            className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSaveProfile} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Contact Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Customer Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:border-emerald-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Number
                </label>
                <input
                  type="text"
                  value={activeCustomer?.phone ? `+91 ${activeCustomer.phone}` : '+91 '}
                  disabled
                  className="w-full px-3 py-2 text-xs rounded border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address (for Invoices)
              </label>
              <input
                type="email"
                placeholder="rahul@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:border-emerald-600 outline-none"
              />
            </div>
          </div>

          {/* Delivery Address Details */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Delivery Location & Address
              </h3>

              {/* 📍 Use Current GPS Location Button */}
              <button
                type="button"
                onClick={handleGetGpsLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Locating...' : '📍 Use Current GPS Location'}</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Street Address / Flat / Floor
              </label>
              <input
                type="text"
                placeholder="e.g. Flat 402, Green Valley Apartments"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:border-emerald-600 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  placeholder="Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:border-emerald-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  placeholder="Maharashtra"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:border-emerald-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  placeholder="400001"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:border-emerald-600 outline-none"
                />
              </div>
            </div>

            {/* Interactive Leaflet Map GPS Picker */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>📍 Pinpoint Delivery GPS on Map:</span>
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

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsProfileOpen(false)}
              className="px-4 py-2 rounded text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Profile & Location</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
