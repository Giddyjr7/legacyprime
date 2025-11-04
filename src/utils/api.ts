import axios, { AxiosInstance } from 'axios';

// --- 1. Custom API Error Class ---

/**
 * Custom error class for handling API response errors with structured data.
 */
export class APIError extends Error {
    public status: number;
    public data: any; // Use 'any' to capture different potential error response bodies

    constructor(message: string, status: number, data: any) {
        super(message);
        this.status = status;
        this.data = data;
        this.name = 'APIError';

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, APIError.prototype);
    }
}

// --- 2. Base URL Configuration ---

// Determine the API base URL based on the environment
const getApiBaseUrl = () => {
    // First check for explicit API URL in environment variables
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }

    // Fallback to environment-based logic
    if (import.meta.env.PROD) {
        // Use the deployed backend URL in production
        return 'https://legacyprime.onrender.com/api';
    }

    // Use localhost in development
    return 'http://localhost:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();

// --- 3. Endpoint Definitions ---

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

// --- 4. CSRF Cookie Reader Utility ---

/**
 * Extracts the value of the 'csrftoken' cookie from document.cookie.
 * @returns The CSRF token string or null if not found.
 */
function getCsrfToken(): string | null {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        // Check if this cookie starts with 'csrftoken='
        if (cookie.startsWith('csrftoken=')) {
            // Return the value part of the cookie
            return cookie.substring('csrftoken='.length, cookie.length);
        }
    }
    return null;
}

// --- 5. Axios Instance Configuration ---

// Create an Axios instance configured for Django/DRF
export const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    // CRITICAL: Tells the browser to include cookies (sessionid and csrftoken) 
    // in cross-site requests. This is mandatory for your setup.
    withCredentials: true,
});

// --- 6. Request Interceptor to attach CSRF Token ---

// Define "safe" methods (which don't require the CSRF token)
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS', 'TRACE'];

api.interceptors.request.use((config) => {
    // Only attempt to attach the CSRF token for non-safe methods (POST, PUT, DELETE, etc.)
    if (config.method && !SAFE_METHODS.includes(config.method.toUpperCase())) {
        const csrfToken = getCsrfToken();
        
        if (csrfToken) {
            // Attach the token to the 'X-CSRFToken' header
            config.headers['X-CSRFToken'] = csrfToken;
        } else {
            // This is a critical debugging point
            console.error('CSRF Token not found in cookies for non-safe method:', config.url);
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// --- 7. Response Interceptor for Error Handling (Optional but Recommended) ---
// This automatically wraps all Axios errors in our custom APIError for predictable handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (axios.isAxiosError(error) && error.response) {
            // Convert Axios error to our custom APIError
            throw new APIError(
                error.message,
                error.response.status,
                error.response.data
            );
        }
        // For network errors or other non-response errors, re-throw the original error
        return Promise.reject(error);
    }
);
