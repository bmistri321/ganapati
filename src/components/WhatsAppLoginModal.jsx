import React, { useState, useRef, useEffect } from 'react';
import { X, ArrowRight, CheckCircle, Smartphone, User, MapPin, Mail, Home, Navigation } from 'lucide-react';
import { requestStoreWhatsAppOtp, verifyStoreWhatsAppOtp, upsertStoreCustomerProfile } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LocationPicker } from './LocationPicker';

export const WhatsAppLoginModal = () => {
  const { isAuthOpen, setIsAuthOpen, setCurrentCustomer } = useAuth();
  const { showToast } = useToast();

  const [phone, setPhone] = useState('9876543210');
  // step: 'phone' | 'otp' | 'onboarding'
  const [step, setStep] = useState('onboarding');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(300);

  // First-time onboarding state
  const [onboardingData, setOnboardingData] = useState({
    fullName: '',
    street: '',
    city: 'Habra / Ashoknagar',
    state: 'West Bengal',
    postalCode: '743263',
    email: '',
    coordinates: { lat: 22.8291, lng: 88.6148 }
  });
  const [onboardingErrors, setOnboardingErrors] = useState({});

  const inputRefs = useRef([]);

  useEffect(() => {
    let timer;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAuthOpen) closeLoginModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthOpen]);

  if (!isAuthOpen) return null;

  const closeLoginModal = () => {
    setIsAuthOpen(false);
    setStep('phone');
    setOtpDigits(['', '', '', '', '', '']);
  };

  const formatMinutes = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Step 1: Send OTP to customer's WhatsApp
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    setLoading(true);
    try {
      await requestStoreWhatsAppOtp(cleanPhone);
      setStep('otp');
      setCountdown(300);
      showToast('6-digit OTP sent to your WhatsApp!', 'success');
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    } catch (err) {
      showToast(err.message || 'Failed to send WhatsApp OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otpDigits];
    newOtp[index] = value.substring(value.length - 1);
    setOtpDigits(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 digits are entered
    if (index === 5 && value) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        verifyCode(fullOtp);
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (pastedData.length === 6) {
      verifyCode(pastedData);
    }
  };

  const verifyCode = async (codeToVerify) => {
    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const res = await verifyStoreWhatsAppOtp(cleanPhone, codeToVerify);
      
      const loggedInCust = res.customer;
      localStorage.setItem('customer_session', JSON.stringify(loggedInCust));
      setCurrentCustomer(loggedInCust);

      // Check if user is a first-time user without saved name or address
      const isFirstTime = !loggedInCust?.fullName || 
        loggedInCust?.fullName === 'Verified Customer' || 
        !loggedInCust?.address ||
        !loggedInCust?.shippingAddress?.street;

      if (isFirstTime) {
        // Switch to Step 3: First-Time Onboarding
        setOnboardingData((prev) => ({
          ...prev,
          fullName: loggedInCust.fullName !== 'Verified Customer' ? (loggedInCust.fullName || '') : '',
          email: loggedInCust.email || '',
          street: loggedInCust.address || loggedInCust.shippingAddress?.street || '',
          city: loggedInCust.city || 'Habra / Ashoknagar',
          postalCode: loggedInCust.postalCode || '743263',
          coordinates: {
            lat: loggedInCust.gpsLat || loggedInCust.shippingAddress?.coordinates?.lat || 22.8291,
            lng: loggedInCust.gpsLng || loggedInCust.shippingAddress?.coordinates?.lng || 88.6148
          }
        }));
        setStep('onboarding');
        showToast('OTP verified! Please set up your delivery details.', 'info');
      } else {
        showToast(`Welcome back, ${loggedInCust.fullName || 'Customer'}!`, 'success');
        closeLoginModal();
      }
    } catch (err) {
      showToast('Invalid OTP code. Please check your WhatsApp.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Manual click verify
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      showToast('Please enter the complete 6-digit OTP', 'warning');
      return;
    }
    await verifyCode(fullOtp);
  };

  // Step 3: Save First-Time Customer Onboarding Details
  const handleSaveOnboarding = async (e) => {
    e?.preventDefault();
    const errs = {};
    if (!onboardingData.fullName.trim()) errs.fullName = 'Full Name is required';
    if (!onboardingData.street.trim()) errs.street = 'Delivery address is required';
    if (!onboardingData.city.trim()) errs.city = 'City is required';
    if (!onboardingData.postalCode.trim()) errs.postalCode = 'Pincode is required';

    if (Object.keys(errs).length > 0) {
      setOnboardingErrors(errs);
      showToast('Please fill in all required delivery details', 'warning');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const saved = await upsertStoreCustomerProfile({
        phone: cleanPhone,
        fullName: onboardingData.fullName.trim(),
        name: onboardingData.fullName.trim(),
        email: onboardingData.email.trim(),
        address: onboardingData.street.trim(),
        city: onboardingData.city.trim(),
        state: onboardingData.state.trim(),
        postalCode: onboardingData.postalCode.trim(),
        gpsLat: onboardingData.coordinates.lat,
        gpsLng: onboardingData.coordinates.lng,
      });

      if (saved && saved.customer) {
        localStorage.setItem('customer_session', JSON.stringify(saved.customer));
        setCurrentCustomer(saved.customer);
      }

      showToast('Profile & delivery address saved! Ready for 1-click checkout.', 'success');
      closeLoginModal();
    } catch (err) {
      showToast('Failed to save profile: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={closeLoginModal}
      />

      {/* Slide-over Right Side Panel Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto">
        <div className="w-full sm:w-screen sm:max-w-md bg-white shadow-2xl flex flex-col animate-slide-left border-l border-slate-200/90 h-full overflow-hidden">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between bg-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Smartphone className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  {step === 'onboarding' ? 'Customer Profile' : 'WhatsApp Login'}
                </h2>
                <p className="text-xs text-slate-500">
                  {step === 'otp' ? 'Enter 6-digit verification code' : step === 'onboarding' ? 'Complete your delivery details' : 'Direct 1-Click Verification'}
                </p>
              </div>
            </div>

            <button
              onClick={closeLoginModal}
              className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7">

        {step === 'phone' && (
          /* Step 1: Mobile Phone Number Input */
          <div className="w-full space-y-6 text-left">
            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Welcome to Ganapati Store
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your WhatsApp number to receive an instant <br />
                6-digit verification code.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 text-left">
                  WhatsApp Mobile Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm font-semibold text-slate-500 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-14 pr-3.5 py-3 text-sm font-semibold bg-[#F4F5F7] hover:bg-[#EAECEF] focus:bg-white rounded-xl border border-transparent focus:border-slate-400 outline-none transition-all text-left"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm active:scale-98 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {step === 'otp' && (
          /* Step 2: 6-Digit OTP Verification */
          <div className="w-full space-y-6 text-left">
            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Enter WhatsApp OTP
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter the 6-digit code sent to <strong className="text-slate-900 font-bold">+91 {phone}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-5 text-left">
              {/* 6 Soft Light-Gray Boxes */}
              <div className="flex justify-between gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e.key)}
                    className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl font-bold rounded-xl transition-all outline-none ${
                      digit 
                        ? 'bg-white border-2 border-emerald-600 text-slate-900 shadow-xs' 
                        : 'bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white text-slate-900'
                    }`}
                  />
                ))}
              </div>

              {/* Countdown & Resend Option */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>
                  Resend in <strong className="text-slate-800 font-mono">{formatMinutes(countdown)}</strong>
                </span>
                <button
                  type="button"
                  disabled={countdown > 0}
                  onClick={handleSendOtp}
                  className="font-bold text-emerald-700 hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Resend OTP
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otpDigits.join('').length < 6}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm active:scale-98 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Verify Code</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {step === 'onboarding' && (
          /* Step 3: First-Time User Profile & Address Setup */
          <div className="space-y-5 pb-6">
            <div className="space-y-1.5 pb-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Set Up Your Delivery Profile
              </h2>
              <p className="text-xs text-slate-500">
                Please enter your delivery details once. Next time, enjoy 1-click checkout!
              </p>
            </div>

            <form onSubmit={handleSaveOnboarding} className="space-y-4 pt-1">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={onboardingData.fullName}
                    onChange={(e) => {
                      setOnboardingData({ ...onboardingData, fullName: e.target.value });
                      if (onboardingErrors.fullName) setOnboardingErrors({ ...onboardingErrors, fullName: null });
                    }}
                    className={`w-full pl-9 pr-3 py-2.5 text-xs font-medium rounded-lg border outline-none ${
                      onboardingErrors.fullName ? 'border-rose-400 bg-rose-50/40' : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500'
                    }`}
                  />
                </div>
                {onboardingErrors.fullName && (
                  <span className="text-[10px] text-rose-500 font-medium">{onboardingErrors.fullName}</span>
                )}
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="e.g. name@example.com"
                    value={onboardingData.email}
                    onChange={(e) => setOnboardingData({ ...onboardingData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Delivery Address / House / Flat <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    rows={2}
                    placeholder="e.g. Flat 402, Green Valley Apartments, Station Road"
                    value={onboardingData.street}
                    onChange={(e) => {
                      setOnboardingData({ ...onboardingData, street: e.target.value });
                      if (onboardingErrors.street) setOnboardingErrors({ ...onboardingErrors, street: null });
                    }}
                    className={`w-full pl-9 pr-3 py-2 text-xs font-medium rounded-lg border outline-none ${
                      onboardingErrors.street ? 'border-rose-400 bg-rose-50/40' : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500'
                    }`}
                  />
                </div>
                {onboardingErrors.street && (
                  <span className="text-[10px] text-rose-500 font-medium">{onboardingErrors.street}</span>
                )}
              </div>

              {/* City & Pincode */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Habra / Ashoknagar"
                    value={onboardingData.city}
                    onChange={(e) => {
                      setOnboardingData({ ...onboardingData, city: e.target.value });
                      if (onboardingErrors.city) setOnboardingErrors({ ...onboardingErrors, city: null });
                    }}
                    className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pincode <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 743263"
                    value={onboardingData.postalCode}
                    onChange={(e) => {
                      setOnboardingData({ ...onboardingData, postalCode: e.target.value.replace(/\D/g, '') });
                      if (onboardingErrors.postalCode) setOnboardingErrors({ ...onboardingErrors, postalCode: null });
                    }}
                    className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* GPS Location Pin */}
              <div className="pt-2">
                <LocationPicker
                  coordinates={onboardingData.coordinates}
                  onChange={(coords) => setOnboardingData({ ...onboardingData, coordinates: coords })}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 active:scale-98 cursor-pointer mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Save</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

          </div>
        </div>
      </div>
    </div>
  );
};
