import axios from 'axios';
import { mockApi } from './mockApi';
import toast from 'react-hot-toast';

export const API_BASE_URL = import.meta.env.VITE_BACKEND_API || 'http://localhost:5001';

const api = axios.create({
    baseURL: API_BASE_URL
});

let isOfflineNotified = false;

// Request Interceptor to add Auth Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor for Offline Fallback
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { config } = error;

        // Define what constitutes a network/server issue
        const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED';
        const isServerError = error.response && error.response.status >= 500;

        if (isNetworkError || isServerError) {
            if (!isOfflineNotified) {
                console.warn('⚠️ Backend issue. Switching to Offline Mock Mode.');
                toast('Backend issue. Switching to Offline Mode.', { icon: '📡' });
                isOfflineNotified = true;
            }

            // Route to Mock API based on URL
            try {
                const url = config.url || '';
                const method = (config.method || 'get').toLowerCase();

                // --- AUTH --- //
                if (url.includes('/auth/login')) {
                    const data = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
                    const result = await mockApi.login(data);
                    return { data: result, status: 200 };
                }

                if (url.includes('/auth/register')) {
                    const data = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
                    const result = await mockApi.register(data);
                    return { data: result, status: 200 };
                }

                if (url.includes('/auth/verify-otp')) {
                    const data = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
                    const result = await mockApi.verifyOtp(data);
                    return { data: result, status: 200 };
                }

                // --- POSTS SUB-ROUTES --- //
                if (url.includes('/trending/hashtags')) {
                    return {
                        data: [
                            { tag: 'kiit', count: 42 },
                            { tag: 'engineering', count: 35 },
                            { tag: 'campus', count: 28 },
                            { tag: 'tech', count: 20 },
                            { tag: 'events', count: 15 }
                        ],
                        status: 200
                    };
                }

                if (url.includes('/posts/events')) {
                    // Mock events
                    return { data: [], status: 200 };
                }

                // --- USERS SUB-ROUTES --- //
                if (url.includes('/users/suggestions')) {
                    return { data: [], status: 200 };
                }

                // --- POSTS --- //
                if (url.includes('/posts')) {
                    if (method === 'get') {
                        // Check if it's a specific post ID
                        const postIdMatch = url.match(/\/posts\/([a-zA-Z0-9_-]+)/);
                        if (postIdMatch && !url.includes('/comments')) {
                            // Mock single post fetch if needed (optional)
                        }

                        const result = await mockApi.getPosts();
                        return { data: result, status: 200 };
                    }

                    if (method === 'post') {
                        // DISABLE MOCK FALLBACK for debugging
                        return Promise.reject(error);

                        /*
                        let postData = {};
                        if (config.data instanceof FormData) {
                            postData = {
                                title: config.data.get('title'),
                                content: config.data.get('content'),
                                category: config.data.get('category'),
                                tags: config.data.get('tags'),
                                isAnonymous: config.data.get('isAnonymous') === 'true'
                            };
                        } else {
                            postData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
                        }
                        const result = await mockApi.createPost(postData);
                        return { 
                            data: { 
                                post: result,
                                message: 'Post created (Offline Mode)',
                                moderationStatus: 'approved'
                            }, 
                            status: 200 
                        };
                        */
                    }
                } // Close if (url.includes('/posts'))

            } catch (mockError) {
                return Promise.reject(mockError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

