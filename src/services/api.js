// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'https://study-mitra-backend.onrender.com/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Interceptors ---

// Request interceptor - Add token to all requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
                        refresh: refreshToken,
                    });

                    if (response.data.access) {
                        localStorage.setItem('access_token', response.data.access);
                        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                        return api(originalRequest);
                    }
                }
            } catch (refreshError) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

// --- API Endpoints ---

// Auth API
export const authAPI = {
    login: async (credentials) => {
        const response = await api.post('/auth/login/', credentials);
        if (response.data.access) localStorage.setItem('access_token', response.data.access);
        if (response.data.refresh) localStorage.setItem('refresh_token', response.data.refresh);

        // Fetch profile using the corrected endpoint
        try {
            const profileResponse = await api.get('/userprofile/me/');
            const userData = {
                id: profileResponse.data.id,
                username: profileResponse.data.username || profileResponse.data.user?.username,
                email: profileResponse.data.email || profileResponse.data.user?.email,
            };
            localStorage.setItem('user', JSON.stringify(userData));
        } catch (e) {
            localStorage.setItem('user', JSON.stringify({ username: credentials.username }));
        }
        return response.data;
    },

    register: (userData) => api.post('/auth/register/', userData),

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    },

    getCurrentUser: () => JSON.parse(localStorage.getItem('user')),
    isAuthenticated: () => !!localStorage.getItem('access_token'),
};

// Study Posts API
export const studyPostsAPI = {
    getAll: (params = {}) => api.get('/study-posts/', { params }),
    getOne: (id) => api.get(`/study-posts/${id}/`),
    create: (data) => api.post('/study-posts/', data),
    update: (id, data) => api.patch(`/study-posts/${id}/`, data),
    delete: (id) => api.delete(`/study-posts/${id}/`),
    join: (id) => api.post(`/study-posts/${id}/join/`),
};

// Study Sessions API
export const studySessionsAPI = {
    getAll: () => api.get('/sessions/'),
    getOne: (id) => api.get(`/sessions/${id}/`),
    endSession: (id) => api.post(`/sessions/${id}/end_session/`),
    generateNotes: (id, messages) => api.post(`/sessions/${id}/generate_notes/`, { messages }),
    getNotes: (id) => api.get('/notes/', { params: { session: id } }),
};

// Notes & Portfolio API
export const notesAPI = {
    getAll: (params = {}) => api.get('/notes/', { params }),
    getMyNotes: (params = {}) => api.get('/notes/my_notes/', { params }),
    getOne: (id) => api.get(`/notes/${id}/`),
};

// Profile & AI Media API
// Profile & AI Media API
export const profileAPI = {
    getMe: () => api.get('/userprofile/me/'),
    update: (data) => api.patch('/userprofile/me/', data), // ← Change this line
    uploadMedia: (data) => api.post('/userprofile/upload_media/', data),
    getProfile: (username) => api.get(`/userprofile/${username}/`),
};


export default api;