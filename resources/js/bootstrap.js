import axios from 'axios';
import { router } from '@inertiajs/react';

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Initialize Sanctum CSRF cookie when the page loads for SPA authentication
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get Sanctum CSRF cookie for SPA authentication
        await window.axios.get('/sanctum/csrf-cookie');
    } catch (error) {
        console.warn('Failed to initialize Sanctum CSRF cookie:', error);
    }
});

// Handle Inertia events for better error handling
window.addEventListener('load', () => {
    router.on('error', (errors) => {
        console.error('Inertia navigation error:', errors);
    });
});
