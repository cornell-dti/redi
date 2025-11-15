/**
 * Centralized API Client with Bearer Token Authentication
 *
 * This client automatically:
 * - Adds Firebase ID token to all requests
 * - Handles token refresh
 * - Provides error handling for 401/403/429
 * - Implements retry logic
 *
 * SECURITY: All API requests now require Bearer token authentication
 */

import auth from '@react-native-firebase/auth';
import { API_BASE_URL } from '../../constants/constants';

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}

/**
 * API Client configuration
 */
interface APIClientConfig {
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
}

class APIClient {
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;

  constructor(config: APIClientConfig = {}) {
    this.baseURL = config.baseURL || API_BASE_URL;
    this.timeout = config.timeout || 30000; // 30 seconds
    this.retryAttempts = config.retryAttempts || 1;

    // Log API client initialization for debugging production issues
    console.log('API Client initialized with baseURL:', this.baseURL);
  }

  /**
   * Gets Firebase ID token with automatic refresh
   * @param forceRefresh - Force token refresh (for 403 errors)
   * @returns Firebase ID token
   */
  private async getAuthToken(forceRefresh: boolean = false): Promise<string> {
    const currentUser = auth().currentUser;

    if (!currentUser) {
      console.error('[API] No current user - authentication required');
      throw new APIError(
        'Not authenticated. Please sign in.',
        401,
        'AUTH_REQUIRED'
      );
    }

    console.log('[API] Getting token for user:', currentUser.email);

    try {
      const token = await currentUser.getIdToken(forceRefresh);
      console.log('[API] Token obtained, length:', token?.length);
      console.log('[API] Token preview:', token?.substring(0, 50) + '...');
      return token;
    } catch (error) {
      console.error('[API] Error getting auth token:', error);
      throw new APIError(
        'Failed to get authentication token',
        401,
        'TOKEN_ERROR'
      );
    }
  }

  /**
   * Makes an authenticated API request
   * @param endpoint - API endpoint (e.g., '/api/profiles/me')
   * @param options - Fetch options
   * @param attempt - Current retry attempt
   * @returns Response data
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt: number = 0
  ): Promise<T> {
    try {
      // Get fresh token
      const token = await this.getAuthToken(attempt > 0);

      // Build full URL
      const url = `${this.baseURL}${endpoint}`;

      // Log API request for debugging (only log URL, never log token)
      console.log(`[API] ${options.method || 'GET'} ${url}`);

      // Build headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      };

      // Make request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle response
      return await this.handleResponse<T>(response, endpoint, options, attempt);
    } catch (error: any) {
      // Re-throw API errors first (includes auth errors)
      if (error instanceof APIError) {
        throw error;
      }

      // Handle timeout
      if (error.name === 'AbortError') {
        throw new APIError('Request timeout', 408, 'TIMEOUT');
      }

      // Handle network errors
      if (error.message === 'Network request failed') {
        console.error('[API] Network error - Check connection and API URL');
        throw new APIError(
          'Network error. Please check your connection.',
          0,
          'NETWORK_ERROR'
        );
      }

      // Unknown error
      console.error('[API] Unexpected error:', error);
      throw new APIError('An unexpected error occurred', 500, 'UNKNOWN_ERROR');
    }
  }

  /**
   * Handles API response and errors
   */
  private async handleResponse<T>(
    response: Response,
    endpoint: string,
    options: RequestInit,
    attempt: number
  ): Promise<T> {
    // Success
    if (response.ok) {
      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    }

    // Parse error response
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: response.statusText };
    }

    const errorMessage =
      errorData.error || errorData.message || 'Request failed';

    if (response.status === 404) {
      console.log(`[API] 404 Not Found: ${endpoint}`);
    } else {
      console.error(`[API] Error ${response.status} response:`, errorData);
    }

    // Handle specific status codes
    switch (response.status) {
      case 401:
        // Unauthorized - token missing or invalid
        throw new APIError(
          errorMessage || 'Authentication required. Please sign in again.',
          401,
          'UNAUTHORIZED'
        );

      case 403:
        // Forbidden - token expired or insufficient permissions
        // Retry once with refreshed token
        if (attempt < this.retryAttempts) {
          console.log('403 error, retrying with refreshed token...');
          return await this.request<T>(endpoint, options, attempt + 1);
        }
        throw new APIError(
          errorMessage || 'Access forbidden. You may not have permission.',
          403,
          'FORBIDDEN'
        );

      case 404:
        throw new APIError(
          errorMessage || 'Resource not found',
          404,
          'NOT_FOUND'
        );

      case 409:
        throw new APIError(
          errorMessage || 'Resource already exists',
          409,
          'CONFLICT'
        );

      case 429:
        // Rate limited - extract retry-after if available
        const retryAfter = response.headers.get('Retry-After');
        throw new APIError(
          errorMessage ||
            `Too many requests. Please try again${retryAfter ? ` in ${retryAfter}` : ' later'}.`,
          429,
          'RATE_LIMITED'
        );

      case 400:
        // Bad request - check for validation errors
        const validationDetails = errorData.details;
        if (validationDetails && Array.isArray(validationDetails)) {
          // Format validation errors for user display
          // Each error has: { param: 'fieldName', msg: 'error message', value: actualValue }
          const formattedErrors = validationDetails
            .map((err: any) => {
              // Make field names more user-friendly
              const fieldName = err.param
                .replace(/([A-Z])/g, ' $1') // Add space before capital letters
                .replace(/^./, (str: string) => str.toUpperCase()) // Capitalize first letter
                .trim();
              return `• ${fieldName}: ${err.msg}`;
            })
            .join('\n');

          console.error('[API] Validation errors:', validationDetails);

          throw new APIError(
            `Please fix the following:\n\n${formattedErrors}`,
            400,
            'VALIDATION_ERROR'
          );
        }
        // If no validation details, use generic message
        throw new APIError(errorMessage || 'Invalid request', 400, 'BAD_REQUEST');

      case 500:
      case 502:
      case 503:
        throw new APIError(
          errorMessage || 'Server error. Please try again later.',
          response.status,
          'SERVER_ERROR'
        );

      default:
        throw new APIError(errorMessage, response.status, 'API_ERROR');
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * Upload files with multipart/form-data
   * Used for image uploads
   */
  async uploadFiles<T>(endpoint: string, formData: FormData): Promise<T> {
    try {
      const token = await this.getAuthToken();
      const url = `${this.baseURL}${endpoint}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type for FormData - browser sets it with boundary
        },
        body: formData,
      });

      return await this.handleResponse<T>(response, endpoint, {}, 0);
    } catch (error: any) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('File upload failed', 500, 'UPLOAD_ERROR');
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export types
export type { APIClientConfig };
