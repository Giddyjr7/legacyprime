// URL helpers
import { joinUrl } from '@/lib/url';

// Determine the API base URL based on the environment
const ensureProtocol = (maybeUrl?: string) => {
  if (!maybeUrl) return maybeUrl || '';
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(maybeUrl)) return maybeUrl;
  if (maybeUrl.startsWith('//')) return window.location.protocol + maybeUrl;
  if (maybeUrl.includes('localhost') || maybeUrl.includes('127.0.0.1')) {
    return `http://${maybeUrl}`;
  }
  return `https://${maybeUrl}`;
};

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim() !== '') {
    return ensureProtocol(import.meta.env.VITE_API_BASE_URL);
  }

  if (import.meta.env.PROD) {
    // Use the deployed backend URL in production
    return ensureProtocol('https://legacyprime.onrender.com/api');
  }

  // Use localhost in development
  return ensureProtocol('http://localhost:8000/api');
};

export const API_BASE_URL = getApiBaseUrl();

export const ENDPOINTS = {
  // Auth endpoints
  LOGIN: joinUrl(API_BASE_URL, 'accounts/token/'),
  REFRESH_TOKEN: joinUrl(API_BASE_URL, 'accounts/token/refresh/'),
  REGISTER: joinUrl(API_BASE_URL, 'accounts/register/'),
  LOGOUT: joinUrl(API_BASE_URL, 'accounts/logout/'),
  PROFILE: joinUrl(API_BASE_URL, 'accounts/profile/'),
  VERIFY_OTP: joinUrl(API_BASE_URL, 'accounts/verify-otp/'),
  RESEND_OTP: joinUrl(API_BASE_URL, 'accounts/resend-otp/'),
  REQUEST_PASSWORD_RESET: joinUrl(API_BASE_URL, 'accounts/request-password-reset/'),
  VERIFY_PASSWORD_RESET_OTP: joinUrl(API_BASE_URL, 'accounts/verify-password-reset-otp/'),
  SET_NEW_PASSWORD: joinUrl(API_BASE_URL, 'accounts/set-new-password/'),
  CSRF: joinUrl(API_BASE_URL, 'accounts/csrf/'),

  // Dashboard
  DASHBOARD_SUMMARY: joinUrl(API_BASE_URL, 'transactions/dashboard/summary/'),
  DASHBOARD_PERFORMANCE: joinUrl(API_BASE_URL, 'transactions/dashboard/performance/'),

  // Wallet
  WALLET_DEPOSIT_REQUEST: joinUrl(API_BASE_URL, 'wallet/deposit/request/'),
  WALLET_DEPOSIT_CONFIRM: (id: number) => joinUrl(API_BASE_URL, `wallet/deposit/${id}/confirm/`),
  WALLET_ADDRESS_BY_METHOD: (method: string) => joinUrl(API_BASE_URL, `wallet/address/?method=${encodeURIComponent(method)}`),
  WALLET_WITHDRAW: joinUrl(API_BASE_URL, 'wallet/withdraw/'),
  WALLET_WITHDRAWAL_ACCOUNTS: joinUrl(API_BASE_URL, 'wallet/withdrawal-accounts/'),
  WALLET_SETTINGS: joinUrl(API_BASE_URL, 'wallet/settings/'),

  // Transaction endpoints
  TRANSACTIONS: joinUrl(API_BASE_URL, 'transactions/'),
  CREATE_TRANSACTION: joinUrl(API_BASE_URL, 'transactions/create/'),

  // Notification endpoints
  NOTIFICATIONS: joinUrl(API_BASE_URL, 'notifications/'),
  MARK_NOTIFICATION_READ: (id: string) => joinUrl(API_BASE_URL, `notifications/${id}/mark-read/`),

  // Account actions
  CHANGE_PASSWORD: joinUrl(API_BASE_URL, 'accounts/change-password/'),
};