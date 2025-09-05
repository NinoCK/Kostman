import { router } from '@inertiajs/react';
import axios from 'axios';

// Configure axios for API requests
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';

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
    
    try {
        // Ensure CSRF cookie is available before making API requests
        await axios.get('/sanctum/csrf-cookie');
        
        let response;
        const config = {
            headers: {
                ...headers,
            },
            withCredentials: true,
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
        // Log the error but don't redirect to avoid infinite loops
        if (error.response?.status === 401) {
            console.warn(`Authentication failed for ${endpoint}. User may need to refresh or re-login.`);
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
