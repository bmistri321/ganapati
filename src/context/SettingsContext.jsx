import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

const DEFAULT_SETTINGS = {
  storeName: 'NEXUS Essentials',
  tagline: 'Frictionless Modern Commerce',
  whatsappNumber: '+91 9147364980', // configured shop whatsapp
  currency: '₹',
  storeAddress: 'Plot 42, Sector 18, Commercial Hub, Gurugram, HR 122008',
  storeHours: 'Mon - Sat: 10:00 AM - 8:30 PM (Sun: 11:00 AM - 6:00 PM)',
  freeShippingThreshold: 999,
  flatShippingFee: 79.00,
  firebaseConfigured: false,
};

const STORAGE_KEY = 'quickcart_store_settings_inr_v2';

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SETTINGS;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  const updateSettings = (newValues) => {
    setSettings((prev) => ({ ...prev, ...newValues }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        isSettingsOpen,
        setIsSettingsOpen
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
