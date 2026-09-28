import { useState, useEffect } from 'react';
import { AdumoSettings } from '@/types/adumo';

const ADUMO_SETTINGS_STORAGE_KEY = 'pharmapos_adumo_settings';

export const DEFAULT_ADUMO_SETTINGS: AdumoSettings = {
  enabled: true,
  environment: 'sandbox',
  mode: 'terminal',
  merchantUid: 'TEST_MERCHANT_UID_1001',
  applicationUid: 'APP_UID_PHARMA_01',
  clientSecret: '',
  terminalId: 'ADUMO-TERM-01',
  terminalIp: '192.168.0.200',
  terminalPort: '8088',
  terminalTimeoutSeconds: 45,
  autoPrintCustomerSlip: true,
};

export function getStoredAdumoSettings(): AdumoSettings {
  try {
    const raw = localStorage.getItem(ADUMO_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_ADUMO_SETTINGS;
    return { ...DEFAULT_ADUMO_SETTINGS, ...JSON.parse(raw) };
  } catch (error) {
    console.error('Error loading Adumo settings from storage', error);
    return DEFAULT_ADUMO_SETTINGS;
  }
}

export function saveStoredAdumoSettings(settings: AdumoSettings): void {
  try {
    localStorage.setItem(ADUMO_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving Adumo settings to storage', error);
  }
}

export function useAdumoSettings() {
  const [settings, setSettings] = useState<AdumoSettings>(getStoredAdumoSettings);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ADUMO_SETTINGS_STORAGE_KEY) {
        setSettings(getStoredAdumoSettings());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateSettings = (newSettings: Partial<AdumoSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveStoredAdumoSettings(updated);
      return updated;
    });
  };

  return {
    settings,
    updateSettings,
    saveSettings: (full: AdumoSettings) => {
      saveStoredAdumoSettings(full);
      setSettings(full);
    },
  };
}
