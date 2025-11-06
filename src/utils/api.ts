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

// --- 4. CSRF Token Management ---

/**
 * Type definition for CSRF token refresh response
 */
interface CSRFResponse {
    csrfToken: string;
}

/**
 * CSRF Token management utility
 */
const CSRFManager = {
    /**
     * Gets the CSRF token from cookies using a more reliable method
     */
    getToken(): string | null {
        const match = document.cookie.match(/csrftoken=([^;]+)/);
        return match ? match[1] : null;
    },

    /**
     * Refreshes the CSRF token by making a request to the CSRF endpoint
     */
    async refresh(): Promise<string | null> {
        try {
            const response = await axios.get<CSRFResponse>(ENDPOINTS.CSRF, {
                withCredentials: true
            });
            // The Django endpoint sets the cookie automatically
            // Return the new token from the cookie
            return this.getToken();
        } catch (error) {
            console.warn('Failed to refresh CSRF token:', error);
            return null;
        }
    },

    /**
     * Ensures a valid CSRF token is available, refreshing if necessary
     */
    async ensure(): Promise<string | null> {
        let token = this.getToken();
        if (!token) {
            token = await this.refresh();
        }
        return token;
    }
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

api.interceptors.request.use(async (config) => {
    // Skip CSRF handling for the CSRF endpoint itself to avoid infinite loops
    if (config.url === ENDPOINTS.CSRF) {
        return config;
    }

    // Only attempt to attach the CSRF token for non-safe methods
    if (config.method && !SAFE_METHODS.includes(config.method.toUpperCase())) {
        try {
            const csrfToken = await CSRFManager.ensure();
            
            if (csrfToken) {
                // Attach the token to the 'X-CSRFToken' header
                config.headers['X-CSRFToken'] = csrfToken;
            } else {
                // Log warning but allow request to proceed - Django will reject if needed
                console.warn(
                    `CSRF token not available for ${config.method?.toUpperCase()} request to ${config.url}. ` +
                    'Request may fail if CSRF protection is required.'
                );
            }
        } catch (error) {
            console.error('Error while ensuring CSRF token:', error);
            // Allow request to proceed - Django will reject if CSRF is required
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// --- 7. Response Interceptor for Error Handling ---
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (axios.isAxiosError(error) && error.response) {
            const { status, data, config } = error.response;

            // Handle CSRF-related errors (403 with specific error message)
            if (status === 403 && 
                typeof data === 'object' && 
                data !== null &&
                'detail' in data && 
                typeof data.detail === 'string' && 
                data.detail.toLowerCase().includes('csrf')) {
                
                // Log the CSRF error for debugging
                console.warn('CSRF validation failed, attempting to refresh token...', {
                    url: config.url,
                    method: config.method
                });

                try {
                    // Attempt to refresh the CSRF token
                    await CSRFManager.refresh();
                    
                    // Retry the original request
                    // Remove the response interceptor temporarily to avoid infinite loops
                    const originalResponse = await axios({
                        ...config,
                        withCredentials: true,
                        headers: {
                            ...config.headers,
                            'X-CSRFToken': CSRFManager.getToken()
                        }
                    });
                    
                    return originalResponse;
                } catch (retryError) {
                    console.error('Failed to recover from CSRF error:', retryError);
                    // If retry fails, throw the original error wrapped in APIError
                    throw new APIError(
                        'CSRF validation failed and recovery was unsuccessful',
                        status,
                        data
                    );
                }
            }

            // For non-CSRF errors, wrap in APIError as before
            throw new APIError(
                error.message,
                status,
                data
            );
        }

        // For network errors or other non-response errors, re-throw the original error
        return Promise.reject(error);
    }
);
