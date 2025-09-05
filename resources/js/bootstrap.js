import axios from 'axios';
import { router } from '@inertiajs/react';

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Set CSRF token
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
} else {
    console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}

// Handle Inertia redirects for authentication
window.addEventListener('load', () => {
    router.on('success', (event) => {
        // Handle successful navigation
    });

    router.on('error', (errors) => {
        // Handle navigation errors
        console.error('Inertia navigation error:', errors);
    });
});
