import { api, APIError, setTokens, clearTokens } from './api';
import { ENDPOINTS } from '@/config/api';

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  password2: string;
  username: string;
  first_name: string;
  last_name: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user?: User;
}

class AuthService {
  private static instance: AuthService;
  private connectionAttempts = 0;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async handleBackendDelay<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    this.connectionAttempts++;
    try {
      // Dispatch event to show connecting state
      window.dispatchEvent(new CustomEvent('auth-connecting', {
        detail: { attempt: this.connectionAttempts, operation: operationName }
      }));

      const result = await operation();
      this.connectionAttempts = 0;
      return result;
    } catch (error) {
      if (this.connectionAttempts <= this.MAX_RETRIES) {
        // Wait with exponential backoff
        const delay = this.RETRY_DELAY * Math.pow(2, this.connectionAttempts - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.handleBackendDelay(operation, operationName);
      }
      this.connectionAttempts = 0;
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.handleBackendDelay(async () => {
      try {
        const response = await api.post<AuthResponse>(ENDPOINTS.LOGIN, credentials);
        const { access, refresh } = response.data;
        
        // Set tokens
        setTokens(access, refresh);

        // Fetch user profile
        const userResponse = await api.get(ENDPOINTS.PROFILE);
        return {
          ...response.data,
          user: userResponse.data
        };
      } catch (error) {
        if (error instanceof APIError) {
          switch (error.status) {
            case 401:
              throw new APIError(
                'Invalid email or password. Please try again.',
                401,
                error.data,
                'INVALID_CREDENTIALS'
              );
            case 429:
              throw new APIError(
                'Too many login attempts. Please try again later.',
                429,
                error.data,
                'RATE_LIMIT'
              );
            default:
              throw error;
          }
        }
        throw error;
      }
    }, 'login');
  }

  async register(data: RegisterData): Promise<{ message: string }> {
    return this.handleBackendDelay(async () => {
      try {
        const response = await api.post<{ message: string }>(ENDPOINTS.REGISTER, data);
        return response.data;
      } catch (error) {
        if (error instanceof APIError) {
          if (error.status === 400) {
            const messages: string[] = [];
            const data = error.data;
            
            // Format validation errors
            Object.keys(data).forEach(key => {
              if (Array.isArray(data[key])) {
                messages.push(`${key}: ${data[key].join(', ')}`);
              }
            });

            throw new APIError(
              messages.join('\n'),
              400,
              error.data,
              'VALIDATION_ERROR'
            );
          }
        }
        throw error;
      }
    }, 'register');
  }

  async verifyOTP(email: string, otp: string): Promise<{ message: string }> {
    return this.handleBackendDelay(async () => {
      const response = await api.post(ENDPOINTS.VERIFY_OTP, { email, otp });
      return response.data;
    }, 'verify-otp');
  }

  async resendOTP(email: string): Promise<{ message: string }> {
    return this.handleBackendDelay(async () => {
      const response = await api.post(ENDPOINTS.RESEND_OTP, { email });
      return response.data;
    }, 'resend-otp');
  }

  async logout(): Promise<void> {
    clearTokens();
    // Optional: Call backend logout endpoint if needed
  }

  async refreshToken(refreshToken: string): Promise<string> {
    try {
      const response = await api.post(ENDPOINTS.REFRESH_TOKEN, {
        refresh: refreshToken
      });
      return response.data.access;
    } catch (error) {
      clearTokens();
      throw error;
    }
  }

  async getUserProfile(): Promise<User> {
    return this.handleBackendDelay(async () => {
      const response = await api.get<User>(ENDPOINTS.PROFILE);
      return response.data;
    }, 'get-profile');
  }
}

export default AuthService.getInstance();