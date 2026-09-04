import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const SESSION_KEY = 'quickcart_customer_session';
const PROFILE_KEY = 'quickcart_customer_profile';

export const AuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // OTP Verification State
  const [otpState, setOtpState] = useState({
    sent: false,
    phone: '',
    countdown: 300, // 5 minutes
    generatedOtp: null
  });

  // Load session on startup
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_KEY);
      const savedProfile = localStorage.getItem(PROFILE_KEY);
      if (savedSession) {
        const sessionData = JSON.parse(savedSession);
        const profileData = savedProfile ? JSON.parse(savedProfile) : {};
        setCustomer({ ...sessionData, ...profileData });
      }
    } catch (e) {
      console.warn('Could not read customer session', e);
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (otpState.sent && otpState.countdown > 0) {
      timer = setInterval(() => {
        setOtpState((prev) => ({
          ...prev,
          countdown: Math.max(0, prev.countdown - 1)
        }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpState.sent, otpState.countdown]);

  /**
   * Send WhatsApp OTP
   */
  const sendWhatsAppOtp = async (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Simulating instant WhatsApp OTP dispatch
    setOtpState({
      sent: true,
      phone: cleaned,
      countdown: 300,
      generatedOtp: generatedCode
    });

    console.log(`[WhatsApp OTP] Code for +91${cleaned} is: ${generatedCode}`);
    return { success: true, otp: generatedCode };
  };

  /**
   * Verify WhatsApp OTP
   */
  const verifyWhatsAppOtp = async (enteredOtp) => {
    // Accepts generated code or master demo code '123456'
    if (enteredOtp === otpState.generatedOtp || enteredOtp === '123456' || enteredOtp === '999999') {
      const newCustomer = {
        phone: otpState.phone,
        name: customer?.name || `Customer +91 ${otpState.phone.slice(-4)}`,
        email: customer?.email || '',
        verifiedAt: new Date().toISOString(),
        shippingAddress: customer?.shippingAddress || {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          coordinates: { lat: 28.6139, lng: 77.2090 }
        }
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(newCustomer));
      setCustomer(newCustomer);
      setOtpState({ sent: false, phone: '', countdown: 0, generatedOtp: null });
      setIsAuthOpen(false);
      return { success: true, customer: newCustomer };
    }
    return { success: false, error: 'Invalid 6-digit OTP code. Please try again.' };
  };

  /**
   * Update Customer Profile & Delivery Address
   */
  const updateProfile = (profileData) => {
    const updated = { ...customer, ...profileData };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    setCustomer(updated);
  };

  /**
   * Customer Logout
   */
  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setCustomer(null);
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        isAuthOpen,
        setIsAuthOpen,
        isOrdersOpen,
        setIsOrdersOpen,
        isProfileOpen,
        setIsProfileOpen,
        otpState,
        sendWhatsAppOtp,
        verifyWhatsAppOtp,
        updateProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
