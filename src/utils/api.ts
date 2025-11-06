import axios, { AxiosInstance } from 'axios';

export class APIError extends Error {
    public status: number;
    public data: any;

    constructor(message: string, status: number, data: any) {
        super(message);
        this.status = status;
        this.data = data;
        this.name = 'APIError';
        Object.setPrototypeOf(this, APIError.prototype);
    }
}

const getApiBaseUrl = () => {
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }
    if (import.meta.env.PROD) {
        return 'https://legacyprime.onrender.com/api';
    }
    return 'http://localhost:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const ENDPOINTS = {
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
    DASHBOARD_SUMMARY: `${API_BASE_URL}/transactions/dashboard/summary/`,
    DASHBOARD_PERFORMANCE: `${API_BASE_URL}/transactions/dashboard/performance/`,
    WALLET_DEPOSIT_REQUEST: `${API_BASE_URL}/wallet/deposit/request/`,
    WALLET_DEPOSIT_CONFIRM: (id: number) => `${API_BASE_URL}/wallet/deposit/${id}/confirm/`,
    WALLET_WITHDRAW: `${API_BASE_URL}/wallet/withdraw/`,
    WALLET_WITHDRAWAL_ACCOUNTS: `${API_BASE_URL}/wallet/withdrawal-accounts/`,
    TRANSACTIONS: `${API_BASE_URL}/transactions/`,
    CREATE_TRANSACTION: `${API_BASE_URL}/transactions/create/`,
    NOTIFICATIONS: `${API_BASE_URL}/notifications/`,
    MARK_NOTIFICATION_READ: (id: string) => `${API_BASE_URL}/notifications/${id}/mark-read/`,
    CHANGE_PASSWORD: `${API_BASE_URL}/accounts/change-password/`,
};

// Simple CSRF token management
const getCSRFToken = (): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : null;
};

let csrfToken: string | null = getCSRFToken();

export const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// Request interceptor - attach CSRF token
api.interceptors.request.use((config) => {
    // Skip for CSRF endpoint
    if (config.url?.includes('/accounts/csrf/')) {
        return config;
    }

    // Attach CSRF token for non-GET requests
    if (config.method && !['GET', 'HEAD', 'OPTIONS'].includes(config.method.toUpperCase())) {
        if (csrfToken && config.headers) {
            config.headers['X-CSRFToken'] = csrfToken;
        }
    }
    
    return config;
});

// Response interceptor - handle CSRF errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (axios.isAxiosError(error) && error.response) {
            const { status, data, config } = error.response;

            // Handle CSRF errors
            if (status === 403 && 
                typeof data === 'object' && 
                data !== null &&
                'detail' in data && 
                typeof data.detail === 'string' && 
                data.detail.toLowerCase().includes('csrf')) {
                
                console.log('CSRF token invalid, fetching new one...');

                try {
                    // Fetch new CSRF token
                    await axios.get(ENDPOINTS.CSRF, { withCredentials: true });
                    csrfToken = getCSRFToken();
                    
                    console.log('New CSRF token:', csrfToken);

                    // Retry the original request with new token
                    if (config && csrfToken) {
                        const retryConfig = {
                            ...config,
                            headers: {
                                ...config.headers,
                                'X-CSRFToken': csrfToken
                            }
                        };
                        return axios(retryConfig);
                    }
                } catch (refreshError) {
                    console.error('Failed to refresh CSRF token:', refreshError);
                }
            }

            throw new APIError(
                error.message,
                status,
                data
            );
        }

        return Promise.reject(error);
    }
);

// Export CSRF functions
export const ensureCSRFToken = async (): Promise<string | null> => {
    if (!csrfToken) {
        try {
            await axios.get(ENDPOINTS.CSRF, { withCredentials: true });
            csrfToken = getCSRFToken();
        } catch (error) {
            console.warn('Failed to ensure CSRF token:', error);
        }
    }
    return csrfToken;
};

export const getCurrentCSRFToken = (): string | null => csrfToken;