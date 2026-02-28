import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import { useAuth } from "../../App";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  Users,
  Activity,
  Loader,
  Building2,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";

const EnterpriseDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [companyData, setCompanyData] = useState({
  company_name: "",
  registration_no: "",
  gst_number: "",
  company_website: "",
  services_offered: "",
  company_description: "",
  representative_name: "",
  representative_email: "",
  representative_phone: "",

  logo: null as File | null,
  logoPreview: "",
  kycDocs: [] as File[],
});

  const [sessions, setSessions] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [wallet, setWallet] = useState(0);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      await fetchProfile();
      await Promise.all([
        fetchSessions(),
        fetchTeam(),
        fetchWallet(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH PROFILE ================= */

  const fetchProfile = async () => {
    try {
      const res = await api.get("/enterprise/settings");
      const data = res.data || {};

      if (data.company_name) {
        setProfileLoaded(true);
      }

      setCompanyData({
  company_name: data.company_name || "",
  registration_no: data.registration_no || "",
  gst_number: data.gst_number || "",
  company_website: data.company_website || "",
  services_offered: data.services_offered || "",
  company_description:
    data.company_description || data.description || "",
  representative_name: data.representative_name || "",
  representative_email: data.representative_email || "",
  representative_phone: data.representative_phone || "",

  // 🔥 NEW FIELDS
  logo: null, // file object should not come from backend
  logoPreview: data.logo || "", // existing logo URL from backend
  kycDocs: [], // uploaded files only (not from backend)
});
    } catch {
      setProfileLoaded(false);
    }
  };

  /* ================= SAVE PROFILE ================= */

  const handleSaveProfile = async () => {
  try {
    const formData = new FormData();

    Object.entries(companyData).forEach(([key, value]) => {
      if (
        key !== "logo" &&
        key !== "logoPreview" &&
        key !== "kycDocs"
      ) {
        formData.append(key, value as string);
      }
    });

    if (companyData.logo) {
      formData.append("logo", companyData.logo);
    }

    companyData.kycDocs.forEach((doc) =>
      formData.append("documents", doc)
    );

    await api.put("/enterprise/settings", formData);

    addToast("Company profile created", "success");
    setProfileLoaded(true);
  } catch {
    addToast("Failed to save profile", "error");
  }
};

  /* ================= FETCH OTHER DATA ================= */

  const fetchSessions = async () => {
    try {
      const res = await api.get("/enterprise/bookings");
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSessions([]);
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await api.get("/enterprise/team");
      setTeam(Array.isArray(res.data) ? res.data : []);
    } catch {
      setTeam([]);
    }
  };

  const fetchWallet = async () => {
    try {
      const res = await api.get("/enterprise/wallet");
      setWallet(res.data?.balance || 0);
    } catch {
      setWallet(0);
    }
  };

  /* ================= CALCULATIONS ================= */

  const completedSessions = sessions.filter(
    (s) => s?.status === "COMPLETED"
  );

  const totalRevenue = useMemo(() => {
    return completedSessions.reduce(
      (sum, s) => sum + (Number(s?.price) || 0),
      0
    );
  }, [completedSessions]);

  const completionRate = useMemo(() => {
    if (!sessions.length) return 0;
    return Math.round(
      (completedSessions.length / sessions.length) * 100
    );
  }, [sessions, completedSessions]);

  if (loading) {
    return (
      <Layout title="Enterprise Dashboard">
        <div className="flex justify-center items-center h-screen">
          <Loader className="animate-spin text-blue-600" size={40} />
        </div>
      </Layout>
    );
  }

  /* ========================================================= */
  /* ================= ONBOARDING FLOW ======================= */
  /* ========================================================= */

 if (!profileLoaded) {
  return (
    <Layout title="Enterprise Onboarding">
      <div className="max-w-3xl mx-auto py-12">
        <div className="bg-white p-10 rounded-3xl shadow-sm space-y-8">

          {/* ================= LOGO TOP CENTER ================= */}
          <div className="flex flex-col items-center space-y-4">

            <div className="w-24 h-24 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden">
              {companyData.logoPreview ? (
                <img
                  src={companyData.logoPreview}
                  alt="Company Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-blue-600">
                  {companyData.company_name?.charAt(0) || "C"}
                </span>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCompanyData({
                    ...companyData,
                    logo: file,
                    logoPreview: URL.createObjectURL(file),
                  });
                }
              }}
              className="text-sm"
            />

            <h2 className="text-2xl font-bold text-center">
              Complete Company Profile
            </h2>
          </div>

          {/* ================= COMPANY DETAILS ================= */}

          <div className="grid md:grid-cols-2 gap-4">
            <input
              placeholder="Company Name"
              value={companyData.company_name}
              onChange={(e) =>
                setCompanyData({
                  ...companyData,
                  company_name: e.target.value,
                })
              }
              className="border rounded-xl px-4 py-3"
            />

            <input
              placeholder="Registration Number"
              value={companyData.registration_no}
              onChange={(e) =>
                setCompanyData({
                  ...companyData,
                  registration_no: e.target.value,
                })
              }
              className="border rounded-xl px-4 py-3"
            />

            <input
              placeholder="GST Number"
              value={companyData.gst_number}
              onChange={(e) =>
                setCompanyData({
                  ...companyData,
                  gst_number: e.target.value,
                })
              }
              className="border rounded-xl px-4 py-3"
            />

            <input
              placeholder="Company Website"
              value={companyData.company_website}
              onChange={(e) =>
                setCompanyData({
                  ...companyData,
                  company_website: e.target.value,
                })
              }
              className="border rounded-xl px-4 py-3"
            />
          </div>

          <textarea
            placeholder="Services Offered"
            value={companyData.services_offered}
            onChange={(e) =>
              setCompanyData({
                ...companyData,
                services_offered: e.target.value,
              })
            }
            className="w-full border rounded-xl px-4 py-3"
          />

          <textarea
            placeholder="Company Description"
            value={companyData.company_description}
            onChange={(e) =>
              setCompanyData({
                ...companyData,
                company_description: e.target.value,
              })
            }
            className="w-full border rounded-xl px-4 py-3"
          />

          {/* ================= REPRESENTATIVE ================= */}

          <div className="grid md:grid-cols-3 gap-4">
            <input
              placeholder="Representative Name"
              value={companyData.representative_name}
              onChange={(e) =>
                setCompanyData({
                  ...companyData,
                  representative_name: e.target.value,
                })
              }
              className="border rounded-xl px-4 py-3"
            />

            <input
              placeholder="Representative Email"
              value={companyData.representative_email}
              onChange={(e) =>
                setCompanyData({
                  ...companyData,
                  representative_email: e.target.value,
                })
              }
              className="border rounded-xl px-4 py-3"
            />

            <input
              placeholder="Representative Phone"
              value={companyData.representative_phone}
              onChange={(e) =>
                setCompanyData({
                  ...companyData,
                  representative_phone: e.target.value,
                })
              }
              className="border rounded-xl px-4 py-3"
            />
          </div>

          {/* ================= KYC DOCUMENTS ================= */}

          <div>
            <label className="block text-sm font-semibold mb-2">
              Upload Business KYC Documents
            </label>

            <input
              type="file"
              multiple
              onChange={(e) =>
                setCompanyData({
                  ...companyData,
                  kycDocs: Array.from(e.target.files || []),
                })
              }
            />

            {companyData.kycDocs?.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {companyData.kycDocs.length} document(s) selected
              </p>
            )}
          </div>

          {/* ================= SAVE BUTTON ================= */}

          <button
            onClick={handleSaveProfile}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl"
          >
            Save & Continue
          </button>

        </div>
      </div>
    </Layout>
  );
}

  /* ========================================================= */
  /* ================= DASHBOARD VIEW ======================== */
  /* ========================================================= */

  return (
    <Layout title="Enterprise Dashboard">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 rounded-3xl">
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {companyData.company_name} 👋
          </h1>
          <p>{companyData.services_offered}</p>
          <p className="text-blue-100 mt-2">
            Representative: {companyData.representative_name}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border shadow-sm">
            <Wallet className="text-blue-600 mb-3" />
            <p className="text-2xl font-bold">
              ₹{totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">
              Company Earnings
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border shadow-sm">
            <Users className="text-green-600 mb-3" />
            <p className="text-2xl font-bold">
              {team.length}
            </p>
            <p className="text-xs text-gray-500">
              Active Consultants
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border shadow-sm">
            <Activity className="text-purple-600 mb-3" />
            <p className="text-2xl font-bold">
              {completionRate}%
            </p>
            <p className="text-xs text-gray-500">
              Session Success Rate
            </p>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default EnterpriseDashboard;