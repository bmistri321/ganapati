import React, { useState, useRef, useEffect } from 'react';
import { X, MessageCircle, ArrowRight, ShieldCheck, RefreshCw, CheckCircle, Smartphone } from 'lucide-react';
import { requestStoreWhatsAppOtp, verifyStoreWhatsAppOtp } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const WhatsAppLoginModal = () => {
  const { isAuthOpen, setIsAuthOpen, setCurrentCustomer } = useAuth();
  const { showToast } = useToast();

  const [phone, setPhone] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [demoCode, setDemoCode] = useState(null);
  const [countdown, setCountdown] = useState(300);

  const inputRefs = useRef([]);

  useEffect(() => {
    let timer;
    if (otpStep && countdown > 0) {
      timer = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    }
    return () => clearInterval(timer);
  }, [otpStep, countdown]);

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
    setOtpStep(false);
    setOtpDigits(['', '', '', '', '', '']);
  };

  const formatMinutes = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Step A: Send OTP to customer's WhatsApp
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await requestStoreWhatsAppOtp(cleanPhone);
      setDemoCode(res.otp);
      setOtpStep(true); // show the 6-digit input box
      setCountdown(300);
      showToast(`6-digit OTP sent to your WhatsApp! (Code: ${res.otp})`, 'success');
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
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

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Step B: Customer enters the 6-digit code
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      showToast('Please enter the complete 6-digit OTP', 'warning');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const res = await verifyStoreWhatsAppOtp(cleanPhone, fullOtp);
      // Save session in localStorage
      localStorage.setItem('customer_session', JSON.stringify(res.customer));
      setCurrentCustomer(res.customer);
      showToast('WhatsApp verification successful!', 'success');
      closeLoginModal();
    } catch (err) {
      showToast('Invalid OTP code. Please check your WhatsApp.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={closeLoginModal}
      />

      {/* Modern White Minimalist Modal Card */}
      <div className="relative bg-white rounded shadow-2xl max-w-md w-full overflow-hidden z-10 animate-slide-up border border-slate-200/90 my-auto p-6 sm:p-8">
        
        {/* Close Button */}
        <button
          onClick={closeLoginModal}
          className="absolute top-4 right-4 p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!otpStep ? (
          /* Step 1: Mobile Number Input */
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                WhatsApp Quick Login
              </h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Enter your WhatsApp number to receive an instant 6-digit verification code. No passwords required.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  WhatsApp Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-slate-500 select-none">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-16 pr-3 py-2.5 text-sm font-semibold rounded border border-slate-300 focus:border-emerald-600 outline-none transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 px-4 rounded text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 active:scale-98"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send WhatsApp OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe & Secure WhatsApp Authentication</span>
            </div>
          </div>
        ) : (
          /* Step 2: 6-Digit OTP Verification */
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
                <Smartphone className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Enter WhatsApp OTP
              </h2>
              <p className="text-xs text-slate-500">
                A 6-digit verification code has been sent to <strong className="text-slate-800">+91 {phone}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {/* 6 Inputs */}
              <div className="flex justify-between gap-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e.key)}
                    className="w-11 h-12 sm:w-12 sm:h-14 text-center text-lg font-black text-slate-900 rounded border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all"
                  />
                ))}
              </div>

              {/* Countdown & Resend */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Expires in: <strong className="text-slate-800">{formatMinutes(countdown)}</strong>
                </span>
                <button
                  type="button"
                  disabled={countdown > 0}
                  onClick={handleSendOtp}
                  className="font-bold text-emerald-700 hover:text-emerald-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  Resend OTP on WhatsApp
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otpDigits.join('').length < 6}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 px-4 rounded text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 active:scale-98"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
