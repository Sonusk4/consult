import axios from "axios";
import { UserRole } from "../types";

/* ================= AXIOS INSTANCE ================= */

const api = axios.create({
  baseURL: "/", // Using Vite proxy
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

    const event = new CustomEvent("toast", {
      detail: { message, type: "error" },
    });

    window.dispatchEvent(event);

    return Promise.reject(error);
  }
);

/* ================= REQUEST INTERCEPTOR ================= */

api.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem("user");

    if (userStr) {
      try {
        const user = JSON.parse(userStr);

        if (user.email) {
          config.headers["x-user-email"] = user.email;
        }
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ========================================================= */
/* ======================= AUTH ============================= */
/* ========================================================= */

export const auth = {
  login: async (email: string, role?: string, phone?: string) => {
    const response = await api.post("/auth/me", {
      email,
      role,
      phone,
    });
    return response.data;
  },

  sendOtp: async (email: string) => {
    const response = await api.post("/auth/send-otp", { email });
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
};

/* ========================================================= */
/* ========================= USERS ========================== */
/* ========================================================= */

export const users = {
  uploadProfilePic: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
      "/user/upload-profile-pic",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

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

  complete: async (bookingId: number, duration: number) => {
    const response = await api.post(
      `/bookings/${bookingId}/complete`,
      { call_duration: duration }
    );
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
