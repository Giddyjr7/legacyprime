type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface FetchOptions extends RequestInit {
  method: RequestMethod;
  headers?: HeadersInit;
  body?: any;
  credentials?: RequestCredentials;
}

export class APIError extends Error {
  status: number;
  data?: any;
  
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.name = 'APIError';
    this.data = data;
  }
}

export const fetchApi = async <T = any>(url: string, options: FetchOptions): Promise<T> => {
  try {
    const getCsrfToken = (): string | null => {
      const name = 'csrftoken';
      let cookieValue = null;
      if (typeof document !== 'undefined' && document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            break;
          }
        }
      }
      return cookieValue;
    };

    // Start with base headers that are always needed
    const baseHeaders: HeadersInit = {
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRFToken': getCsrfToken() || '',
    };

    // Only add Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      baseHeaders['Content-Type'] = 'application/json';
    }

    const headers: HeadersInit = {
      ...baseHeaders,
      ...(options.headers || {}),
    };

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
      mode: 'cors',
    };

    // Only JSON stringify if not FormData
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);
    
    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      // Try to extract a useful error message from common DRF response shapes.
      let errorMessage = 'Something went wrong';

      if (data) {
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (typeof data === 'object') {
          // DRF returns field->list errors, e.g. { "current_password": ["..."] }
          const firstEntry = Object.entries(data)[0];
          if (firstEntry) {
            const [, val] = firstEntry;
            if (Array.isArray(val) && val.length > 0) {
              errorMessage = val[0];
            } else if (typeof val === 'string') {
              errorMessage = val;
            } else if (data.message) {
              errorMessage = data.message;
            } else if (data.detail) {
              errorMessage = data.detail;
            }
          } else if (data.message) {
            errorMessage = data.message;
          } else if (data.detail) {
            errorMessage = data.detail;
          }
        }
      }

      throw new APIError(errorMessage, response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Network error', 500);
  }
};

// Convenience methods
export const api = {
  get: <T = any>(url: string, options: Omit<FetchOptions, 'method'> = {}) => 
    fetchApi<T>(url, { ...options, method: 'GET' }),
    
  post: <T = any>(url: string, data?: any, options: Omit<FetchOptions, 'method' | 'body'> = {}) => 
    fetchApi<T>(url, { ...options, method: 'POST', body: data }),
    
  put: <T = any>(url: string, data?: any, options: Omit<FetchOptions, 'method' | 'body'> = {}) => 
    fetchApi<T>(url, { ...options, method: 'PUT', body: data }),
    
  patch: <T = any>(url: string, data?: any, options: Omit<FetchOptions, 'method' | 'body'> = {}) => 
    fetchApi<T>(url, { ...options, method: 'PATCH', body: data }),
    
  delete: <T = any>(url: string, options: Omit<FetchOptions, 'method'> = {}) => 
    fetchApi<T>(url, { ...options, method: 'DELETE' }),
};