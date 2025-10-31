// Use 'localhost' to match the dev frontend origin (vite runs on http://localhost:8080)
// This avoids cookie/host mismatches where the browser treats 'localhost' and
// '127.0.0.1' as different origins which can prevent session cookies from being stored/sent.
export const API_BASE_URL = 'http://localhost:8000/api';

export const ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/accounts/login/`,
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
  
  // Transaction endpoints
  TRANSACTIONS: `${API_BASE_URL}/transactions/`,
  CREATE_TRANSACTION: `${API_BASE_URL}/transactions/create/`,
  
  // Notification endpoints
  NOTIFICATIONS: `${API_BASE_URL}/notifications/`,
  MARK_NOTIFICATION_READ: (id: string) => `${API_BASE_URL}/notifications/${id}/mark-read/`,

  // Account actions
  CHANGE_PASSWORD: `${API_BASE_URL}/accounts/change-password/`,
};