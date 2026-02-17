import axios from 'axios';

// Create axios instance with base URL
// Since we have set up proxy in vite.config.ts, we can just use '/' as base
const api = axios.create({
    baseURL: '/',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle specific error cases here, e.g., 401 Unauthorized
        // We can dispatch actions or show notifications
        console.error('API Error:', error.response?.data?.error || error.message);
        return Promise.reject(error);
    }
);

export const auth = {
    // Login or Register (Dev Flow)
    login: async (email: string, role: string, phone?: string) => {
        const response = await api.post('/auth/me', { email, role, phone });
        return response.data;
    },

    // Send OTP
    sendOtp: async (email: string) => {
        const response = await api.post('/auth/send-otp', { email });
        return response.data;
    },

    // Verify OTP
    verifyOtp: async (email: string, otp: string) => {
        const response = await api.post('/auth/verify-otp', { email, otp });
        return response.data;
    }
};

export const consultants = {
    // Get all consultants (with optional domain filter)
    getAll: async (domain?: string) => {
        const response = await api.get('/consultants', { params: { domain } });
        return response.data;
    },

    // Get single consultant details
    getById: async (id: string) => {
        const response = await api.get(`/consultants/${id}`);
        return response.data;
    },

    // Get current consultant profile
    getProfile: async () => {
        // Hack: Send email in header or body to identify user since we don't have proper headers with Firebase disabled
        // But backend relies on 'req.user' populated by verifyFirebaseToken
        // In dev mode (global.is_firebase_enabled = false), backend mocks a user if not present.
        // However, for getProfile, it needs a specific user context.
        // The current backend dev middleware creates a random user if headers are missing.
        // We might need to adjust backend middleware or pass a dummy token that maps to a specific email?
        // Wait, backend auth middleware says: if (!req.user) req.user = { firebase_uid: 'test...', email: req.body?.email }
        // GET requests don't have a body. So we might face issues getting specific profile.
        // Let's rely on the plan to just use Login for now and see what works.
        const response = await api.get('/consultant/profile');
        return response.data;
    },

    // Register consultant profile
    register: async (data: any) => {
        const response = await api.post('/consultant/register', data);
        return response.data;
    },

    // Update consultant profile
    updateProfile: async (data: any) => {
        const response = await api.put('/consultant/profile', data);
        return response.data;
    },

    // Upload profile picture
    uploadProfilePic: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/consultant/upload-profile-pic', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};

export const bookings = {
    // Create booking
    create: async (data: { consultant_id: string; date: string; time_slot: string }) => {
        const response = await api.post('/bookings/create', data);
        return response.data;
    },

    // Get my bookings
    getAll: async () => {
        const response = await api.get('/bookings');
        return response.data;
    }
};

export default api;
