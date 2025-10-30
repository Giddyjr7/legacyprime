type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface FetchOptions extends RequestInit {
  method: RequestMethod;
  headers?: HeadersInit;
  body?: any;
  credentials?: RequestCredentials;
}

export class APIError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'APIError';
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

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRFToken': getCsrfToken() || '',
      ...(options.headers || {}),
    };

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // This is important for handling cookies
      mode: 'cors',  // Enable CORS
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);
    
    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || 
        (typeof data.error === 'string' ? data.error : 
        (data.detail || 'Something went wrong'));
      throw new APIError(errorMessage, response.status);
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