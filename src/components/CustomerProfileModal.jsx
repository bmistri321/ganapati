import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Check, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LocationPicker } from './LocationPicker';

export const CustomerProfileModal = () => {
  const { isProfileOpen, setIsProfileOpen, customer, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    notes: '',
    coordinates: { lat: 28.6139, lng: 77.2090 }
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        street: customer.shippingAddress?.street || '',
        city: customer.shippingAddress?.city || '',
        state: customer.shippingAddress?.state || '',
        postalCode: customer.shippingAddress?.postalCode || '',
        notes: customer.shippingAddress?.notes || '',
        coordinates: customer.shippingAddress?.coordinates || { lat: 28.6139, lng: 77.2090 }
      });
    }
  }, [customer, isProfileOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isProfileOpen) setIsProfileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProfileOpen, setIsProfileOpen]);

  if (!isProfileOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile({
      name: formData.name,
      email: formData.email,
      shippingAddress: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        notes: formData.notes,
        coordinates: formData.coordinates
      }
    });

    showToast('Profile & GPS delivery address saved!', 'success');
    setIsProfileOpen(false);
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
        <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
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
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  value={customer?.phone ? `+91 ${customer.phone}` : '+91 '}
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
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:border-emerald-600 outline-none"
              />
            </div>
          </div>

          {/* Delivery Address Details */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Delivery Location & Address
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Street Address / Flat / Floor
              </label>
              <input
                type="text"
                placeholder="e.g. Flat 402, Green Valley Apartments"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:border-emerald-600 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  placeholder="Mumbai"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:border-emerald-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  placeholder="Maharashtra"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:border-emerald-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  placeholder="400001"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:border-emerald-600 outline-none"
                />
              </div>
            </div>

            {/* Interactive Leaflet Map GPS Picker */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>📍 Pinpoint Delivery GPS on Map:</span>
                <span className="text-[10px] font-mono text-emerald-700">
                  {formData.coordinates?.lat?.toFixed(4)}, {formData.coordinates?.lng?.toFixed(4)}
                </span>
              </label>
              <LocationPicker
                coordinates={formData.coordinates}
                onChange={(coords) => setFormData({ ...formData, coordinates: coords })}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsProfileOpen(false)}
              className="px-4 py-2 rounded text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Address</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
