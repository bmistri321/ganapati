import React, { useState, useRef, useEffect } from 'react';
import { X, ArrowRight, CheckCircle, Smartphone } from 'lucide-react';
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
      await requestStoreWhatsAppOtp(cleanPhone);
      setOtpStep(true);
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

  // Step B: Manual click verify
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      showToast('Please enter the complete 6-digit OTP', 'warning');
      return;
    }
    await verifyCode(fullOtp);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={closeLoginModal}
      />

      {/* Mobile-First Bottom Sheet / Modern Modal Card */}
      <div className="relative bg-white rounded-t-[32px] sm:rounded-2xl shadow-2xl max-w-md w-full overflow-hidden z-10 animate-slide-up border-t sm:border border-slate-200/90 p-6 sm:p-8 pb-8 flex flex-col justify-between max-h-[90vh]">
        
        {/* Mobile Pull/Drag Handle */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />

        {/* Close Button */}
        <button
          onClick={closeLoginModal}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!otpStep ? (
          /* Step 1: Mobile Phone Number Input */
          <div className="space-y-6 pt-2 sm:pt-0">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Login
              </h2>
              <p className="text-xs text-slate-500 mt-1.5">
                Enter your WhatsApp number to receive an instant 6-digit verification code.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mobile Number
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
                    className="w-full pl-14 pr-3.5 py-3 text-sm font-semibold bg-[#F4F5F7] hover:bg-[#EAECEF] focus:bg-white rounded-xl border border-transparent focus:border-slate-400 outline-none transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm active:scale-98"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Step 2: 6-Digit OTP Soft-Box Verification (Exact Match to Figma Concept) */
          <div className="space-y-7 pt-2 sm:pt-0">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Login
              </h2>
              <p className="text-xs text-slate-500 mt-1.5">
                Enter the 6-digit code sent to <strong className="text-slate-800">+91 {phone}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
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
                    className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl font-semibold rounded-xl transition-all outline-none ${
                      digit 
                        ? 'bg-white border-2 border-slate-900 text-slate-900 shadow-xs' 
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
                  className="font-semibold text-slate-900 hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed transition-colors"
                >
                  Resend OTP
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otpDigits.join('').length < 6}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm active:scale-98"
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
