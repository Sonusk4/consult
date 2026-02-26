import axios from "axios";
import { auth as firebaseAuth } from "../src/services/firebase";
import { UserRole } from "../types";

/* ================= AXIOS INSTANCE ================= */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});
/* ================= RESPONSE INTERCEPTOR ================= */

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      "An unexpected error occurred";

    console.error("API Error:", message);

    const isAuthEndpoint =
      error.config?.url?.includes("/auth/verify-otp") ||
      error.config?.url?.includes("/auth/me") ||
      error.config?.url?.includes("/auth/send-otp");

    // Auto-logout when session is invalid (stale token / user deleted from DB)
    const isUserNotFound =
      typeof message === "string" &&
      (message.includes("User not found") ||
        message.includes("Please log in again") ||
        message.includes("Cannot read properties of null"));

    if (!isAuthEndpoint && (error.response?.status === 401 || isUserNotFound)) {
      console.warn("⚠️ Stale session detected — clearing tokens and redirecting to login");
      localStorage.removeItem("user");
      localStorage.removeItem("devToken");
      sessionStorage.clear();
      // Redirect to login (only if not already there)
      if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/signup")) {
        window.location.href = "/login";
      }
    }

    const event = new CustomEvent("toast", {
      detail: { message, type: "error" },
    });

    window.dispatchEvent(event);

    return Promise.reject(error);
  }
);

/* ================= REQUEST INTERCEPTOR ================= */

/* ================= REQUEST INTERCEPTOR ================= */

/* ================= REQUEST INTERCEPTOR ================= */
api.interceptors.request.use(
  async (config) => {
    // Check for dev mode token first (stored in localStorage)
    let devToken = localStorage.getItem("devToken");

    if (devToken) {
      config.headers.Authorization = `Bearer ${devToken}`;
      console.log("✅ Added dev token to request");
      return config;
    }

    // If no dev token but user is logged in, use a session-based auth
    const storedUser = localStorage.getItem("user");
    if (storedUser && !devToken) {
      try {
        const user = JSON.parse(storedUser);
        // Create a mock JWT-like token that the backend can identify
        // Format: base64(header).base64(payload).base64(signature)
        const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
        const payload = btoa(JSON.stringify({
          email: user.email,
          uid: user.id,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours
        }));
        const signature = btoa("dev-mode-signature");
        devToken = `${header}.${payload}.${signature}`;
        localStorage.setItem("devToken", devToken);
        config.headers.Authorization = `Bearer ${devToken}`;
        console.log("✅ Created and added JWT dev token for:", user.email);
        return config;
      } catch (error) {
        console.error("Failed to create dev token:", error);
      }
    }

    // Get current Firebase user
    const user = firebaseAuth.currentUser;

    if (user) {
      try {
        // Get fresh ID token - wait for it
        const token = await user.getIdToken(true); // Force refresh
        config.headers.Authorization = `Bearer ${token}`;
        console.log("✅ Added Firebase token to request for:", user.email);
      } catch (error) {
        console.error("Failed to get Firebase token:", error);
      }
    } else {
      console.log("⚠️ No Firebase user or dev token, request without auth");
      // If no user, maybe wait for auth state?
      // For now, we'll let it fail with 401
    }

    return config;
  },
  (error) => Promise.reject(error)
);
/* ========================================================= */
/* ======================= AUTH ============================= */
/* ========================================================= */

export const auth = {
  login: async (email: string, role?: UserRole, name?: string) => {
    const res = await api.post("/auth/me", {
      email,
      role,
      name,
    });
    return res.data;
  },

  sendOtp: async (email: string, type: "LOGIN" | "SIGNUP") => {
    try {
      console.log(`📤 Sending OTP request for ${email}, type: ${type}`);
      const response = await api.post("/auth/send-otp", { email, type });
      console.log("📥 OTP send response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ sendOtp error:", error);
      throw error;
    }
  },

  verifyOtp: async (email: string, otp: string) => {
    try {
      console.log(`📤 Verifying OTP for ${email}`);
      const response = await api.post("/auth/verify-otp", { email, otp });
      console.log("📥 OTP verify response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ verifyOtp error:", error);
      throw error;
    }
  },

  loginMember: async (username: string, password: string) => {
    try {
      console.log(`📤 Logging in team member: ${username}`);
      const response = await api.post("/auth/login-member", { username, password });
      console.log("📥 Team member login response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ loginMember error:", error);
      throw error;
    }
  },
};
/* ========================================================= */
/* ===================== CONSULTANTS ======================== */
/* ========================================================= */

export const consultants = {
  getAll: async (domain?: string) => {
    const response = await api.get("/consultants", {
      params: { domain },
    });
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

    const response = await api.post(
      "/consultant/upload-profile-pic",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get("/consultant/dashboard-stats");
    return response.data;
  },

  getConsultantBookings: async () => {
    const response = await api.get("/consultant/bookings");
    return response.data;
  },

  getConsultantAvailability: async () => {
    const response = await api.get("/consultant/availability");
    return response.data;
  },

  getConsultantEarnings: async (period: string) => {
    const response = await api.get("/consultant/earnings", {
      params: { period },
    });
    return response.data;
  },

  // KYC / Certificates
  getKycStatus: async () => {
    const response = await api.get("/consultant/kyc-status");
    return response.data;
  },

  getCertificates: async () => {
    const response = await api.get("/consultant/certificates");
    return response.data;
  },

  uploadKycDoc: async (file: File) => {
    const formData = new FormData();
    formData.append("files", file);
    const response = await api.post("/consultant/upload-kyc", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  uploadCertificate: async (file: File) => {
    const formData = new FormData();
    formData.append("files", file);
    const response = await api.post("/consultant/upload-certificates", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  deleteKycDocument: async (documentId: number) => {
    const response = await api.delete(`/consultant/kyc-document/${documentId}`);
    return response.data;
  },

  deleteCertificate: async (certificateId: number) => {
    const response = await api.delete(`/consultant/certificate/${certificateId}`);
    return response.data;
  },
};


/* ========================================================= */
/* ========================= USERS ========================== */
/* ========================================================= */

export const users = {
  getProfile: async () => {
    const response = await api.get("/user/profile");
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put("/user/profile", data);
    return response.data;
  },

  uploadProfilePic: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/user/upload-profile-pic", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  },
};

/* ========================================================= */
/* ========================= WALLET ========================= */
/* ========================================================= */

export const wallet = {
  getBalance: async () => {
    const response = await api.get("/wallet");
    return response.data;
  },

  addCredits: async (amount: number, package_id?: number) => {
    const response = await api.post("/wallet/add-credits", {
      amount,
      package_id,
    });
    return response.data;
  },

  getTransactions: async () => {
    const response = await api.get("/transactions");
    return response.data;
  },

  getCreditPackages: async () => {
    const response = await api.get("/credit-packages");
    return response.data;
  },
};

/* ========================================================= */
/* ======================== BOOKINGS ======================== */
/* ========================================================= */

export const bookings = {
  create: async (data: {
    consultant_id: number;
    date: string;
    time_slot: string;
  }) => {
    const response = await api.post("/bookings/create", data);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get("/bookings");
    return response.data;
  },

  updateStatus: async (bookingId: number, status: 'ACCEPTED' | 'REJECTED' | 'CANCELLED') => {
    const response = await api.put(`/bookings/${bookingId}/status`, { status });
    return response.data;
  },

  complete: async (bookingId: number, duration: number) => {
    const response = await api.post(`/bookings/${bookingId}/complete`, {
      call_duration: duration,
    });
    return response.data;
  },

  getMessages: async (bookingId: number) => {
    const response = await api.get(`/bookings/${bookingId}/messages`);
    return response.data;
  },

  sendMessage: async (bookingId: number, content: string) => {
    const response = await api.post(`/bookings/${bookingId}/messages`, { content });
    return response.data;
  },
};

/* ========================================================= */
/* ========================= PAYMENTS ======================= */
/* ========================================================= */

export const payments = {
  createOrder: async (amount: number, package_id?: number) => {
    const response = await api.post("/payment/create-order", {
      amount,
      package_id,
    });
    return response.data;
  },

  verifyPayment: async (data: any) => {
    const response = await api.post("/payment/verify", data);
    return response.data;
  },
};

export default api;