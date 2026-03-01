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
      error.config?.url?.includes("/auth/send-otp") ||
      error.config?.url?.includes("/auth/signup") ||
      error.config?.url?.includes("/auth/forgot-password") ||
      error.config?.url?.includes("/auth/reset-password") ||
      error.config?.url?.includes("/auth/change-password-first-login");

    // Auto-logout when session is invalid (stale token / user deleted from DB)
    const isUserNotFound =
      typeof message === "string" &&
      (message.includes("User not found") ||
        message.includes("Please log in again") ||
        message.includes("Cannot read properties of null"));

    if (!isAuthEndpoint && (error.response?.status === 401 || isUserNotFound)) {
      console.warn("⚠️ Stale session detected — clearing tokens and redirecting to login");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("devToken");
      sessionStorage.clear();
      // Redirect to login (HashRouter-safe)
      const currentRoute =
        window.location.hash?.replace(/^#/, "") || window.location.pathname;

      if (!currentRoute.includes("/login") && !currentRoute.includes("/signup")) {
        window.location.hash = "/login";
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
    // Check for dev mode token first (stored in sessionStorage)
    let devToken = sessionStorage.getItem("devToken");

    if (devToken) {
      config.headers.Authorization = `Bearer ${devToken}`;
      return config;
    }

    // If no dev token but user is logged in, use a session-based auth
    const storedUser = sessionStorage.getItem("user");
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
        sessionStorage.setItem("devToken", devToken);
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

  signupWithPassword: async (data: {
    email: string;
    fullName: string;
    phone: string;
    password: string;
    role: UserRole;
  }) => {
    try {
      console.log(`📤 Signing up with password for ${data.email}`);
      const response = await api.post("/auth/signup", data);
      console.log("📥 Signup response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ signupWithPassword error:", error);
      throw error;
    }
  },

  loginWithPassword: async (email: string, password: string) => {
    try {
      console.log(`📤 Logging in with password for ${email}`);
      const response = await api.post("/auth/login-password", {
        email,
        password,
      });
      console.log("📥 Password login response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ loginWithPassword error:", error);
      throw error;
    }
  },

  forgotPassword: async (email: string) => {
    try {
      console.log(`📤 Sending forgot password email to ${email}`);
      const response = await api.post("/auth/forgot-password", { email });
      console.log("📥 Forgot password response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ forgotPassword error:", error);
      throw error;
    }
  },

  resetPassword: async (token: string, newPassword: string, email?: string) => {
    try {
      console.log(`📤 Resetting password with token`);
      const response = await api.post("/auth/reset-password", {
        token,
        newPassword,
        email,
      });
      console.log("📥 Reset password response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ resetPassword error:", error);
      throw error;
    }
  },

  changePasswordFirstLogin: async (newPassword: string) => {
    try {
      console.log(`📤 Changing password on first login`);
      const response = await api.post("/auth/change-password-first-login", {
        newPassword,
      });
      console.log("📥 Password change response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ changePasswordFirstLogin error:", error);
      throw error;
    }
  },

  acceptInvitation: async (
    token: string,
    firebaseUid: string,
    phone: string,
    name: string,
    password: string
  ) => {
    try {
      console.log(`📤 Accepting invitation`);
      const response = await api.post("/enterprise/accept-invite", {
        token,
        firebase_uid: firebaseUid,
        phone,
        name,
        password,
      });
      console.log("📥 Invitation acceptance response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ acceptInvitation error:", error);
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
    const response = await api.get("/consultant/availability/my");
    return response.data;
  },

  getConsultantEarnings: async (period: string) => {
    const response = await api.get("/consultant/earnings", {
      params: { period },
    });
    return response.data;
  },

  getKycStatus: async () => {
    const response = await api.get("/consultant/kyc-status");
    return response.data;
  },

  getCertificates: async () => {
    const response = await api.get("/consultant/certificates");
    return response.data;
  },

  uploadKycDoc: async (files: File[], documentType?: string) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    if (documentType) formData.append("documentType", documentType);

    const response = await api.post("/consultant/upload-kyc", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  uploadCertificate: async (
    files: File[],
    metadata?: {
      issuer?: string;
      issueDate?: string;
      expiryDate?: string;
      credentialId?: string;
    }
  ) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    if (metadata) {
      if (metadata.issuer) formData.append("issuer", metadata.issuer);
      if (metadata.issueDate) formData.append("issueDate", metadata.issueDate);
      if (metadata.expiryDate) formData.append("expiryDate", metadata.expiryDate);
      if (metadata.credentialId)
        formData.append("credentialId", metadata.credentialId);
    }

    const response = await api.post("/consultant/upload-certificates", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  deleteCertificate: async (certificateId: string | number) => {
    const response = await api.delete(`/consultant/certificates/${certificateId}`);
    return response.data;
  },

  deleteKycDocument: async (documentId: number | string) => {
    const response = await api.delete(`/consultant/kyc-documents/${documentId}`);
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
/* ===================== SUBSCRIPTIONS ===================== */
/* ========================================================= */

export const subscriptions = {
  createOrderUser: async (planName: string) => {
    const response = await api.post("/user/subscription/create-order", { planName });
    return response.data;
  },
  createOrderConsultant: async (planName: string) => {
    const response = await api.post("/consultant/subscription/create-order", { planName });
    return response.data;
  },
  verifyPayment: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    planName: string;
    userType: "USER" | "CONSULTANT";
  }) => {
    const response = await api.post("/subscription/verify-payment", data);
    return response.data;
  },
  getUsageMetrics: async () => {
    const response = await api.get("/metrics/subscription-usage");
    return response.data;
  },
  purchaseSubscription: async (planName: string, price: number, features: any, duration: number, paymentId: string) => {
    const response = await api.post("/api/subscriptions/purchase", {
      planName,
      price,
      features,
      duration,
      paymentId
    });
    return response.data;
  },
  getUserSubscription: async (userId: string) => {
    const response = await api.get(`/api/subscriptions/user/${userId}`);
    return response.data;
  },
  getSubscriptionPlans: async () => {
    const response = await api.get("/api/subscriptions/plans");
    return response.data;
  },
  cancelSubscription: async () => {
    const response = await api.post("/api/subscriptions/cancel");
    return response.data;
  }
};

export const chatCredits = {
  createOrder: async (packName: string) => {
    const response = await api.post("/payment/chat-credits/create-order", { packName });
    return response.data;
  },
  verifyPayment: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    packName: string;
  }) => {
    const response = await api.post("/payment/chat-credits/verify", data);
    return response.data;
  }
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