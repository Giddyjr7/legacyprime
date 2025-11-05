// Simple helper hook / util for cookie consent handling.
// Exports a small API so other parts of the app can check consent.

export function hasCookieConsent(): boolean | null {
  try {
    const raw = localStorage.getItem('cookieConsent');
    if (raw === null) return null; // no decision yet
    return raw === 'true';
  } catch (e) {
    // In case localStorage is disabled, treat as no-consent
    return null;
  }
}

export function setCookieConsent(value: boolean) {
  try {
    localStorage.setItem('cookieConsent', value ? 'true' : 'false');
  } catch (e) {
    // ignore
  }
}

// A small convenience hook (optional) to use inside components
import { useState, useEffect } from 'react';

export function useCookieConsent() {
  const [consent, setConsent] = useState<boolean | null>(hasCookieConsent());

  useEffect(() => {
    setConsent(hasCookieConsent());
  }, []);

  const accept = () => {
    setCookieConsent(true);
    setConsent(true);
  };

  const decline = () => {
    setCookieConsent(false);
    setConsent(false);
  };

  return { consent, accept, decline } as const;
}

export default useCookieConsent;
