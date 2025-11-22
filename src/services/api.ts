import axios, { 
  AxiosError, 
  AxiosInstance, 
  AxiosResponse,
  InternalAxiosRequestConfig 
} from 'axios';
import { ENDPOINTS } from '@/config/api';
import { joinUrl } from '@/lib/url';

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    public message: string,
    public status: number,
    public data: any,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Get the base URL based on environment
const ensureProtocol = (maybeUrl?: string) => {
  if (!maybeUrl) return maybeUrl || '';
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(maybeUrl)) return maybeUrl;
  if (maybeUrl.startsWith('//')) return window.location.protocol + maybeUrl;
  if (maybeUrl.includes('localhost') || maybeUrl.includes('127.0.0.1')) {
    return `http://${maybeUrl}`;
  }
  return `https://${maybeUrl}`;
};

const getApiBaseUrl = (): string => {
  let base = '';
  if (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim() !== '') {
    base = import.meta.env.VITE_API_BASE_URL;
  } else {
    base = import.meta.env.PROD ? 'https://legacyprime.onrender.com/api' : 'http://localhost:8000/api';
  }

  return ensureProtocol(base);
};

export const API_BASE_URL = getApiBaseUrl();

// Token management
export const getAccessToken = (): string | null => 
  localStorage.getItem('access_token');

export const getRefreshToken = (): string | null => 
  localStorage.getItem('refresh_token');

export const setTokens = (access: string, refresh: string): void => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

export const clearTokens = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Create axios instance with enhanced configuration
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout to 30s
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure retry logic
api.interceptors.request.use(
  async (config) => {
    const retryConfig = config as any;
    if (!retryConfig.retryCount) {
      retryConfig.retryCount = 0;
    }
    return config;
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as any;
    
    // Only retry on network errors or 5xx errors
    if (
      (!error.response && error.code !== 'ECONNABORTED') ||
      (error.response && error.response.status >= 500)
    ) {
      if (!config.retryCount) {
        config.retryCount = 0;
      }

      if (config.retryCount < 3) {
        config.retryCount += 1;
        const delay = Math.pow(2, config.retryCount) * 1000; // Exponential backoff

        // Dispatch retry event
        window.dispatchEvent(new CustomEvent('api-retry', { 
          detail: { 
            retryCount: config.retryCount,
            url: config.url 
          }
        }));

        await new Promise(resolve => setTimeout(resolve, delay));
        return api(config);
      }
    }
    return Promise.reject(error);
  }
);

// Track request status for showing loading states
let activeRequests = 0;
const updateLoadingState = () => {
  if (activeRequests === 0) {
    window.dispatchEvent(new Event('api-idle'));
  } else {
    window.dispatchEvent(new Event('api-loading'));
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    activeRequests++;
    updateLoadingState();

    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    activeRequests--;
    updateLoadingState();
    return Promise.reject(error);
  }
);

// Response interceptor with token refresh logic
api.interceptors.response.use(
  (response) => {
    activeRequests--;
    updateLoadingState();
    return response;
  },
  async (error: AxiosError) => {
    activeRequests--;
    updateLoadingState();

    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle token refresh
    if (error.response?.status === 401) {
      const refreshToken = getRefreshToken();
      const config = originalRequest as any;
      
      if (refreshToken && !config.isRetryingAuth) {
        config.isRetryingAuth = true;
        try {
          const response = await axios.post(joinUrl(API_BASE_URL, 'accounts/token/refresh/'), {
            refresh: refreshToken
          });
          const { access } = response.data;
          setTokens(access, refreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }
          return api(originalRequest);
        } catch (refreshError) {
          clearTokens();
          window.dispatchEvent(new Event('auth-error'));
          return Promise.reject(refreshError);
        }
      }
    }

    // Transform error to user-friendly format
    let userMessage = 'An unexpected error occurred. Please try again.';
    let errorCode = 'UNKNOWN_ERROR';

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          userMessage = 'Please check your input and try again.';
          errorCode = 'INVALID_INPUT';
          break;
        case 401:
          userMessage = 'Please log in to continue.';
          errorCode = 'UNAUTHORIZED';
          break;
        case 403:
          userMessage = 'You don\'t have permission to perform this action.';
          errorCode = 'FORBIDDEN';
          break;
        case 404:
          userMessage = 'The requested resource was not found.';
          errorCode = 'NOT_FOUND';
          break;
        case 429:
          userMessage = 'Too many requests. Please try again later.';
          errorCode = 'RATE_LIMIT';
          break;
        case 500:
          userMessage = 'Server error. Our team has been notified.';
          errorCode = 'SERVER_ERROR';
          break;
      }

      throw new APIError(
        userMessage,
        status,
        data,
        errorCode
      );
    } else if (error.request) {
      // Network error
      throw new APIError(
        'Unable to connect to the server. Please check your internet connection.',
        0,
        null,
        'NETWORK_ERROR'
      );
    }

    return Promise.reject(error);
  }
);

// Health check function
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    await api.get('/health');
    return true;
  } catch {
    return false;
  }
};

// Export default instance
export default api;