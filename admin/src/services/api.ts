import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  console.log("🔐 Request to:", config.url);
  console.log("📤 Data type:", config.data?.constructor?.name);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("✅ Added auth token");
  }
  // If sending FormData, let browser set the Content-Type with boundary
  if (config.data instanceof FormData) {
    console.log("📋 FormData detected - removing Content-Type header");
    delete config.headers["Content-Type"];
  }
  console.log("📝 Headers:", Object.keys(config.headers));
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("adminToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/* ================= ADMIN AUTH ================= */

export const adminAuth = {
  signup: async (
    email: string,
    password: string,
    name: string
  ) => {
    const response = await api.post("/admin/signup", {
      email,
      password,
      name,
    });
    if (response.data.token) {
      localStorage.setItem("adminToken", response.data.token);
    }
    return response.data;
  },

  signin: async (email: string, password: string) => {
    const response = await api.post("/admin/signin", {
      email,
      password,
    });
    if (response.data.token) {
      localStorage.setItem("adminToken", response.data.token);
    }
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/admin/profile");
    return response.data;
  },

  uploadProfilePic: async (file: File) => {
    console.log("📸 Uploading profile picture:", file.name, file.size, file.type);
    const formData = new FormData();
    formData.append("file", file);
    console.log("📋 FormData created with field 'file'");
    const response = await api.post("/admin/profile/upload", formData);
    console.log("✅ Upload response:", response.data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("adminToken");
  },
};

/* ================= DOCUMENTS ================= */

export const documents = {
  getAll: async (status?: string, documentType?: string) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (documentType) params.append("documentType", documentType);

    const response = await api.get(
      `/documents${params.toString() ? `?${params.toString()}` : ""}`
    );
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  getByUserId: async (userId: number) => {
    const response = await api.get(`/documents/user/${userId}`);
    return response.data;
  },

  upload: async (
    file: File,
    documentType: string,
    token?: string
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);

    const headers: any = {
      "Content-Type": "multipart/form-data",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await api.post("/documents/upload", formData, {
      headers,
    });
    return response.data;
  },

  verify: async (id: number, notes?: string) => {
    const response = await api.put(`/documents/${id}/verify`, { notes });
    return response.data;
  },

  reject: async (id: number, rejectionReason: string) => {
    const response = await api.put(`/documents/${id}/reject`, {
      rejectionReason,
    });
    return response.data;
  },
};

/* ================= ADMIN DASHBOARD ================= */

export const dashboard = {
  getStats: async () => {
    const response = await api.get("/admin/dashboard/stats");
    return response.data;
  },

  getActivity: async () => {
    const response = await api.get("/admin/dashboard/activity");
    return response.data;
  },
};

/* ================= CONSULTANTS ================= */

export const consultants = {
  getPendingVerification: async () => {
    const response = await api.get("/admin/consultants/pending");
    return response.data;
  },
};

/* ================= ENTERPRISES ================= */

export const enterprises = {
  getAll: async () => {
    const response = await api.get("/admin/enterprises");
    return response.data;
  },

  getStats: async () => {
    const response = await api.get("/admin/enterprises/stats");
    return response.data;
  },

  getPending: async () => {
    const response = await api.get("/admin/enterprises/pending");
    return response.data;
  },

  verify: async (id: number, verificationNotes?: string) => {
    const response = await api.put(`/admin/enterprises/${id}/verify`, {
      verificationNotes,
    });
    return response.data;
  },

  reject: async (id: number, rejectionReason: string) => {
    const response = await api.put(`/admin/enterprises/${id}/reject`, {
      rejectionReason,
    });
    return response.data;
  },
};

/* ================= INVOICES ================= */

export const invoices = {
  getAll: async (status?: string) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);

    const response = await api.get(
      `/admin/invoices${params.toString() ? `?${params.toString()}` : ""}`
    );
    return response.data;
  },

  getStats: async () => {
    const response = await api.get("/admin/invoices/stats");
    return response.data;
  },
};

export default api;
