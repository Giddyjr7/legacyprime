import React, { useEffect, useState } from 'react';
import { hasCookieConsent, setCookieConsent } from '../hooks/use-cookie-consent';

const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const consent = hasCookieConsent();
    // Show the banner only if consent is not set
    if (consent === null) {
      // small timeout for a nicer entrance
      const t = setTimeout(() => setVisible(true), 250);
      return () => clearTimeout(t);
    }
  }, []);

  // trigger the enter animation when visible flips
  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setEntered(true), 20);
      return () => clearTimeout(t);
    } else {
      setEntered(false);
    }
  }, [visible]);

  const accept = () => {
    setCookieConsent(true);
    setVisible(false);
  };

  const decline = () => {
    setCookieConsent(false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed left-4 right-4 bottom-6 md:left-8 md:right-auto md:bottom-8 md:right-8 z-50"
    >
      <div className={`max-w-xl mx-auto md:mx-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl shadow-lg p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center gap-4 transition-all duration-300 ease-out transform ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex-1 text-sm text-gray-800 dark:text-gray-100">
          <p className="font-medium">We use cookies to enhance your experience.</p>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">By continuing to use this site, you accept our use of cookies.</p>
        </div>

        <div className="flex-shrink-0 flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={decline}
            className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Decline cookies"
          >
            Decline
          </button>

          <button
            onClick={accept}
            className="px-4 py-2 rounded-md bg-crypto-purple hover:bg-crypto-dark-purple text-white text-sm shadow"
            aria-label="Accept cookies"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
