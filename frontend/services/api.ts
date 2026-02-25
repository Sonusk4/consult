import axios from "axios";
import { auth as firebaseAuth } from "../src/services/firebase";
import { UserRole } from "../types";

/* ========================================================= */
/* ===================== AXIOS INSTANCE ===================== */
/* ========================================================= */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

/* ========================================================= */
/* ================== PUBLIC ROUTES (NO TOKEN) ============== */
/* ========================================================= */

const PUBLIC_ROUTES = [
  "/auth/send-otp",
  "/auth/verify-otp",
  "/auth/login",
  "/auth/me",
];

/* ========================================================= */
/* =============== REQUEST INTERCEPTOR (FIXED) ============== */
/* ========================================================= */

api.interceptors.request.use(
  async (config) => {
    // Allow public routes without auth
    if (PUBLIC_ROUTES.some((route) => config.url?.includes(route))) {
      return config;
    }

    // 1️⃣ Dev Mode Token (optional for testing)
    const devToken = localStorage.getItem("devToken");
    if (devToken) {
      config.headers.Authorization = `Bearer ${devToken}`;
      return config;
    }

    // 2️⃣ Custom Backend JWT Token (your real login system)
    const backendToken = localStorage.getItem("authToken");
    if (backendToken) {
      config.headers.Authorization = `Bearer ${backendToken}`;
      return config;
    }

    // 3️⃣ Firebase Token (if logged in with Firebase)
    const user = firebaseAuth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken(true);
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      } catch (err) {
        console.error("Failed to get Firebase token:", err);
      }
    }

    // 4️⃣ No token → let backend return 401
    console.warn("⚠️ No authentication token found for:", config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

/* ========================================================= */
/* ================= RESPONSE INTERCEPTOR =================== */
/* ========================================================= */

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      "An unexpected error occurred";

    console.error("API Error:", message);

    // Prevent auto-logout on OTP endpoints
    const isOtp = error.config?.url?.includes("/auth/verify-otp");
    const isMeRequest = error.config?.url?.includes("/auth/me");

    if (error.response?.status === 401 && !isOtp && !isMeRequest) {
      console.warn("⚠️ Unauthorized - user may need to login again");
    }

    // Global toast event
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: { message, type: "error" },
      })
    );

    return Promise.reject(error);
  }
);

/* ========================================================= */
/* ========================= AUTH =========================== */
/* ========================================================= */

export const auth = {
  login: async (email: string, role?: UserRole, name?: string) => {
    const res = await api.post("/auth/me", { email, role, name });
    return res.data;
  },

  sendOtp: async (email: string, type: "LOGIN" | "SIGNUP") => {
    const response = await api.post("/auth/send-otp", { email, type });
    return response.data;
  },

  verifyOtp: async (email: string, otp: string) => {
    const response = await api.post("/auth/verify-otp", { email, otp });
    return response.data;
  },
};

/* ========================================================= */
/* ===================== CONSULTANTS ======================== */
/* ========================================================= */

export const consultants = {
  getAll: async (domain?: string) => {
    const response = await api.get("/consultants", { params: { domain } });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/consultants/${id}`);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/consultant/profile");
    return response.data;
  },

  register: async (data: any) => {
    const response = await api.post("/consultant/register", data);
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put("/consultant/profile", data);
    return response.data;
  },

  uploadProfilePic: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/consultant/upload-profile-pic", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  getDashboardStats: async () => api.get("/consultant/dashboard-stats").then((res) => res.data),
  getConsultantBookings: async () => api.get("/consultant/bookings").then((res) => res.data),
  getConsultantAvailability: async () => api.get("/consultant/availability").then((res) => res.data),

  getConsultantEarnings: async (period: string) => {
    const response = await api.get("/consultant/earnings", { params: { period } });
    return response.data;
  },

  deleteCertificate: async (certificateId: number) => {
    const response = await api.delete(`/consultant/certificates/${certificateId}`);
    return response.data;
  },

  deleteKycDocument: async (documentId: number) => {
    const response = await api.delete(`/consultant/kyc/${documentId}`);
    return response.data;
  },
};

/* ========================================================= */
/* ======================== BOOKINGS ======================== */
/* ========================================================= */

export const bookings = {
  create: async (data: any) => api.post("/bookings/create", data).then((res) => res.data),
  getAll: async () => api.get("/bookings").then((res) => res.data),

  updateStatus: async (bookingId: number, status: string) =>
    api.put(`/bookings/${bookingId}/status`, { status }).then((res) => res.data),

  complete: async (bookingId: number, duration: number) =>
    api.post(`/bookings/${bookingId}/complete`, { call_duration: duration }).then((res) => res.data),
};

/* ========================================================= */
/* ===================== WALLET / USERS ===================== */
/* ========================================================= */

export const wallet = {
  getBalance: async () => api.get("/wallet").then((res) => res.data),
  addCredits: async (amount: number, package_id?: number) =>
    api.post("/wallet/add-credits", { amount, package_id }).then((res) => res.data),
};

export const users = {
  uploadProfilePic: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/user/upload-profile-pic", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};

export default api;