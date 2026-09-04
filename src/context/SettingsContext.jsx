import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

import { fetchStoreInfoFromBackend } from '../services/supabaseStore';

const DEFAULT_SETTINGS = {
  storeName: 'Storefront',
  tagline: 'Direct WhatsApp Ordering',
  whatsappNumber: '+91 9147364980',
  currency: '₹',
  storeAddress: 'Main Store Hub',
  storeHours: 'Mon - Sat: 9:00 AM - 8:00 PM',
  freeShippingThreshold: 999,
  flatShippingFee: 79.00,
  firebaseConfigured: false,
};

const STORAGE_KEY = 'quickcart_store_settings_live';

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
    // Dynamically fetch store organization name from database
    fetchStoreInfoFromBackend().then((info) => {
      if (info && info.storeName) {
        setSettings((prev) => ({
          ...prev,
          storeName: info.storeName || prev.storeName,
          whatsappNumber: info.whatsappNumber || prev.whatsappNumber
        }));
      }
    });
  }, []);

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
