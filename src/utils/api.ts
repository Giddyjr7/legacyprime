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
    // JWT Authentication endpoints
    LOGIN: `${API_BASE_URL}/accounts/token/`,
    REFRESH_TOKEN: `${API_BASE_URL}/accounts/token/refresh/`,
    
    // User endpoints
    REGISTER: `${API_BASE_URL}/accounts/register/`,
    PROFILE: `${API_BASE_URL}/accounts/profile/`,
    VERIFY_OTP: `${API_BASE_URL}/accounts/verify-otp/`,
    RESEND_OTP: `${API_BASE_URL}/accounts/resend-otp/`,
    CHANGE_PASSWORD: `${API_BASE_URL}/accounts/change-password/`,
    
    // Password reset endpoints
    REQUEST_PASSWORD_RESET: `${API_BASE_URL}/accounts/request-password-reset/`,
    VERIFY_PASSWORD_RESET_OTP: `${API_BASE_URL}/accounts/verify-password-reset-otp/`,
    SET_NEW_PASSWORD: `${API_BASE_URL}/accounts/set-new-password/`,
    
    // Dashboard endpoints
    DASHBOARD_SUMMARY: `${API_BASE_URL}/transactions/dashboard/summary/`,
    DASHBOARD_PERFORMANCE: `${API_BASE_URL}/transactions/dashboard/performance/`,
    
    // Wallet endpoints
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
};

// JWT Token management
const getAccessToken = (): string | null => {
    const token = localStorage.getItem('access_token');
    return token;
};

const getRefreshToken = (): string | null => {
    return localStorage.getItem('refresh_token');
};

export const setTokens = (access: string, refresh: string): void => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
};

export const clearTokens = (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};

export const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // Add timeout
});

// Enhanced Request interceptor with debugging
api.interceptors.request.use((config) => {
    const token = getAccessToken();
    
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Enhanced Response interceptor with debugging
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't already tried to refresh the token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = getRefreshToken();

            if (refreshToken) {
                try {
                    const response = await axios.post(ENDPOINTS.REFRESH_TOKEN, {
                        refresh: refreshToken
                    });

                    const { access } = response.data;
                    
                    // Store the new access token
                    localStorage.setItem('access_token', access);
                    
                    // Retry the original request with the new token
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return axios(originalRequest);
                } catch (refreshError) {
                    // Clear tokens and redirect to login if refresh fails
                    clearTokens();
                    window.location.href = '/auth/login';
                    return Promise.reject(refreshError);
                }
            } else {
                // No refresh token available, redirect to login
                clearTokens();
                window.location.href = '/auth/login';
            }
        }

        // For other errors, wrap in APIError
        if (axios.isAxiosError(error) && error.response) {
            throw new APIError(
                error.message,
                error.response.status,
                error.response.data
            );
        }

        return Promise.reject(error);
    }
);

// Export token functions for use in components
export { getAccessToken, getRefreshToken };