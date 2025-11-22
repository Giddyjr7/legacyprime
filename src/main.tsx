
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import "./assets/LEGACYPRIME-LOGO-WEB-ICON.png";
import { AuthProvider } from "./context/AuthContext";

// Runtime guard: wrap the global URL constructor to prevent uncaught "Invalid URL" errors
// caused by third-party code or malformed strings. This ensures the app doesn't crash
// if someone calls `new URL(...)` with an invalid value.
(() => {
  try {
    const NativeURL = (window as any).URL;
    // Only patch if not already patched
    if (NativeURL && !(NativeURL as any).__safePatched) {
      const SafeURL = function (url: string | URL, base?: string | URL) {
        try {
          // If url is already a URL instance, return as-is
          if (url instanceof NativeURL) return url;
          if (base !== undefined) return new NativeURL(url as any, base as any);
          return new NativeURL(url as any);
        } catch (err) {
          // Fallback: try to coerce to a string with protocol, else return about:blank
          try {
            const s = String(url || '');
            if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(s)) {
              return new NativeURL(s);
            }
            // If it's likely a host like example.com, add https://
            if (s && !s.includes(' ')) {
              return new NativeURL('https://' + s);
            }
          } catch (inner) {
            // ignore
          }
          return new NativeURL('about:blank');
        }
      } as unknown as typeof URL;

      // Preserve static properties
      Object.getOwnPropertyNames(NativeURL).forEach((prop) => {
        try {
          (SafeURL as any)[prop] = (NativeURL as any)[prop];
        } catch (e) {
          // ignore
        }
      });
      (SafeURL as any).__safePatched = true;
      (window as any).URL = SafeURL;
    }
  } catch (e) {
    // If anything goes wrong, don't block app startup
    // eslint-disable-next-line no-console
    console.warn('Safe URL wrapper failed to initialize', e);
  }
})();

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
