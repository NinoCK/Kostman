import { router } from '@inertiajs/react';
import axios from 'axios';

// Configure axios for API requests
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';

// Global flag to prevent API calls during logout
let isLoggingOut = false;

// Global abort controller for canceling requests during logout
let globalAbortController: AbortController | null = null;

// Function to set logout state
export function setLoggingOut(loggingOut: boolean) {
    isLoggingOut = loggingOut;
    
    // Cancel all pending requests when starting logout
    if (loggingOut && globalAbortController) {
        globalAbortController.abort('User is logging out');
        globalAbortController = null;
    }
    
    // Create new abort controller when not logging out
    if (!loggingOut) {
        globalAbortController = new AbortController();
    }
}

// Initialize abort controller
setLoggingOut(false);

// Get CSRF token from meta tag
function getCSRFToken(): string {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') || '' : '';
}

// Set up axios to use CSRF token
const csrfToken = getCSRFToken();
if (csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}

// API configuration
const API_BASE = '';

interface ApiRequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
}

export async function apiRequest(endpoint: string, options: ApiRequestOptions = {}) {
    const { method = 'GET', body, headers = {} } = options;
    
    // Prevent API calls during logout
    if (isLoggingOut) {
        throw new Error('API calls are disabled during logout');
    }
    
    try {
        // Only try to refresh CSRF cookie if we're not logging out
        if (!isLoggingOut) {
            // Ensure CSRF cookie is available before making API requests
            await axios.get('/sanctum/csrf-cookie', {
                signal: globalAbortController?.signal
            });
        }
        
        let response;
        const config = {
            headers: {
                ...headers,
            },
            withCredentials: true,
            signal: globalAbortController?.signal, // Add abort signal to all requests
        };

        switch (method) {
            case 'GET':
                response = await axios.get(`${API_BASE}${endpoint}`, config);
                break;
            case 'POST':
                response = await axios.post(`${API_BASE}${endpoint}`, body, config);
                break;
            case 'PUT':
                response = await axios.put(`${API_BASE}${endpoint}`, body, config);
                break;
            case 'PATCH':
                response = await axios.patch(`${API_BASE}${endpoint}`, body, config);
                break;
            case 'DELETE':
                response = await axios.delete(`${API_BASE}${endpoint}`, config);
                break;
            default:
                throw new Error(`Unsupported method: ${method}`);
        }
        
        return response.data;
    } catch (error: any) {
        // Handle abort errors silently during logout
        if (error.name === 'AbortError' || error.message === 'User is logging out') {
            console.log('API request cancelled during logout');
            return null;
        }
        
        // Handle authentication errors
        if (error.response?.status === 401 || error.response?.status === 419) {
            if (isLoggingOut) {
                console.log('Authentication error during logout (expected)');
                return null;
            } else {
                console.warn(`Authentication failed for ${endpoint}. User may need to refresh or re-login.`);
            }
        }
        
        console.error(`API Request failed for ${endpoint}:`, error);
        throw error;
    }
}

// Convenience methods
export const api = {
    get: (endpoint: string) => apiRequest(endpoint),
    post: (endpoint: string, data?: any) => apiRequest(endpoint, { method: 'POST', body: data }),
    put: (endpoint: string, data?: any) => apiRequest(endpoint, { method: 'PUT', body: data }),
    patch: (endpoint: string, data?: any) => apiRequest(endpoint, { method: 'PATCH', body: data }),
    delete: (endpoint: string) => apiRequest(endpoint, { method: 'DELETE' }),
};
