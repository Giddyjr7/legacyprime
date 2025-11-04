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

/**
 * Helper function to retrieve a specific cookie value by name (e.g., 'csrftoken').
 */
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


export const fetchApi = async <T = any>(url: string, options: FetchOptions): Promise<T> => {
  try {
    
    const isSafeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase());
    
    // Initialize headers with user-provided options
    const headers: HeadersInit = {
        'X-Requested-With': 'XMLHttpRequest',
        ...(options.headers || {}),
    };

    // Only add Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    // CRITICAL FIX: Only include X-CSRFToken for non-safe methods (POST, PUT, DELETE, etc.)
    if (!isSafeMethod) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        (headers as Record<string, string>)['X-CSRFToken'] = csrfToken;
      } else {
        // Log a warning, but often a preceding GET to /api/accounts/csrf/ ensures this is present
        console.warn('CSRF token not found for non-safe method on endpoint:', url);
      }
    }


    const config: RequestInit = {
      ...options,
      headers,
      // CRITICAL: Must be 'include' for cross-site cookie transmission
      credentials: 'include',
      // 'cors' is fine, but 'omit' is the default and sufficient with credentials: 'include'
      mode: 'cors', 
    };

    // Only JSON stringify if not FormData and body exists
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      config.body = JSON.stringify(options.body);
    } else {
      config.body = options.body;
    }

    const response = await fetch(url, config);
    
    // Handle 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    // Attempt to read data as JSON for both success and error paths
    let data: any = null;
    try {
        data = await response.json();
    } catch (e) {
        // If it fails to parse JSON, assume success means no body or error means plain text
        if (!response.ok) {
            data = await response.text();
        }
    }


    if (!response.ok) {
      // Try to extract a useful error message from common DRF response shapes.
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;

      if (data) {
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (typeof data === 'object') {
            // Check for common DRF errors
            if (data.detail) {
                errorMessage = data.detail;
            } else if (data.message) {
                errorMessage = data.message;
            } else {
                // Get the first error from the fields
                const firstEntry = Object.entries(data)[0];
                if (firstEntry) {
                    const [key, val] = firstEntry;
                    if (Array.isArray(val) && val.length > 0) {
                        errorMessage = `${key}: ${val[0]}`;
                    } else if (typeof val === 'string') {
                        errorMessage = val;
                    } else if (typeof val === 'object') {
                        errorMessage = `Validation error in ${key}`;
                    }
                }
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
    // For network errors
    throw new APIError('Network error or request failed to complete', 500);
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
