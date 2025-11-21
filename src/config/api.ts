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
  if (import.meta.env.VITE_API_BASE_URL) {
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
  LOGIN: `${API_BASE_URL}/accounts/token/`,
  REFRESH_TOKEN: `${API_BASE_URL}/accounts/token/refresh/`,
  REGISTER: `${API_BASE_URL}/accounts/register/`,
  LOGOUT: `${API_BASE_URL}/accounts/logout/`,
  PROFILE: `${API_BASE_URL}/accounts/profile/`,
  VERIFY_OTP: `${API_BASE_URL}/accounts/verify-otp/`,
  RESEND_OTP: `${API_BASE_URL}/accounts/resend-otp/`,
  REQUEST_PASSWORD_RESET: `${API_BASE_URL}/accounts/request-password-reset/`,
  VERIFY_PASSWORD_RESET_OTP: `${API_BASE_URL}/accounts/verify-password-reset-otp/`,
  SET_NEW_PASSWORD: `${API_BASE_URL}/accounts/set-new-password/`,
  CSRF: `${API_BASE_URL}/accounts/csrf/`,
  
  // Dashboard
  DASHBOARD_SUMMARY: `${API_BASE_URL}/transactions/dashboard/summary/`,
  DASHBOARD_PERFORMANCE: `${API_BASE_URL}/transactions/dashboard/performance/`,
  
  // Wallet
  WALLET_DEPOSIT_REQUEST: `${API_BASE_URL}/wallet/deposit/request/`,
  WALLET_DEPOSIT_CONFIRM: (id: number) => `${API_BASE_URL}/wallet/deposit/${id}/confirm/`,
  WALLET_WITHDRAW: `${API_BASE_URL}/wallet/withdraw/`,
  WALLET_WITHDRAWAL_ACCOUNTS: `${API_BASE_URL}/wallet/withdrawal-accounts/`,
  WALLET_SETTINGS: `${API_BASE_URL}/wallet/settings/`,
  
  // Transaction endpoints
  TRANSACTIONS: `${API_BASE_URL}/transactions/`,
  CREATE_TRANSACTION: `${API_BASE_URL}/transactions/create/`,
  
  // Notification endpoints
  NOTIFICATIONS: `${API_BASE_URL}/notifications/`,
  MARK_NOTIFICATION_READ: (id: string) => `${API_BASE_URL}/notifications/${id}/mark-read/`,

  // Account actions
  CHANGE_PASSWORD: `${API_BASE_URL}/accounts/change-password/`,
};