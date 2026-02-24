import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import {
  Building2,
  Settings,
  ShieldCheck,
  DollarSign,
  FileText,
  Loader,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";

const EnterpriseSettings: React.FC = () => {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [branding, setBranding] = useState({
    logo: null as File | null,
    logoUrl: "",
    tagline: "",
    description: "",
    defaultPricing: 150,
  });

  const [company, setCompany] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
  });

  const [documents, setDocuments] = useState<File[]>([]);
  const [existingDocs, setExistingDocs] = useState<string[]>([]);

  const [preferences, setPreferences] = useState({
    allowConsultantPricing: true,
    autoAssignSessions: false,
  });

  const [verificationStatus, setVerificationStatus] =
    useState("PENDING");

  /* ================= FETCH SETTINGS ================= */

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/enterprise/settings");
      const data = res.data;

      setBranding({
        logo: null,
        logoUrl: data.logoUrl || data.logo || "",
        tagline: data.tagline || "",
        description: data.description || "",
        defaultPricing: data.defaultPricing || 150,
      });

      setCompany({
        name: data.company_name || data.name || "",
        email: data.company_email || data.email || "",
        phone: data.company_phone || data.phone || "",
        website: data.company_website || "",
      });

      setPreferences({
        allowConsultantPricing:
          data.allowConsultantPricing ?? true,
        autoAssignSessions:
          data.autoAssignSessions ?? false,
      });

      setExistingDocs(data.documents || []);
      setVerificationStatus(data.verificationStatus || "PENDING");
    } catch (error) {
      console.error("Failed to fetch settings", error);
      addToast("Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= SAVE SETTINGS ================= */

  const saveSettings = async () => {
    try {
      setSaving(true);
      const formData = new FormData();

      // Branding
      formData.append("tagline", branding.tagline);
      formData.append("description", branding.description);
      formData.append(
        "defaultPricing",
        branding.defaultPricing.toString()
      );

      // Company Info
      formData.append("company_name", company.name);
      formData.append("company_phone", company.phone);
      formData.append("company_website", company.website);
      formData.append("company_description", branding.description);

      // Preferences
      formData.append(
        "allowConsultantPricing",
        preferences.allowConsultantPricing.toString()
      );
      formData.append(
        "autoAssignSessions",
        preferences.autoAssignSessions.toString()
      );

      // Logo
      if (branding.logo) {
        formData.append("logo", branding.logo);
      }

      // Documents
      documents.forEach((doc) =>
        formData.append("documents", doc)
      );

      const res = await api.put("/enterprise/settings", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      addToast("Enterprise settings updated successfully", "success");
      await fetchSettings();
    } catch (error) {
      console.error("Failed to save settings", error);
      addToast("Failed to update settings", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <Layout title="Enterprise Settings">
        <div className="flex justify-center items-center h-[60vh]">
          <Loader className="animate-spin text-blue-600" size={40} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Enterprise Settings">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <Settings size={36} className="text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Enterprise Settings
          </h1>
        </div>

        {/* ================= COMPANY INFO ================= */}
        <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Building2 className="text-blue-600" />
            <h2 className="text-xl font-bold">Company Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={company.name}
                onChange={(e) =>
                  setCompany({ ...company, name: e.target.value })
                }
                className="w-full border rounded-xl px-4 py-3"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                value={company.email}
                disabled
                className="w-full border rounded-xl px-4 py-3 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={company.phone}
                onChange={(e) =>
                  setCompany({ ...company, phone: e.target.value })
                }
                className="w-full border rounded-xl px-4 py-3"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Website
              </label>
              <input
                type="url"
                value={company.website}
                onChange={(e) =>
                  setCompany({ ...company, website: e.target.value })
                }
                className="w-full border rounded-xl px-4 py-3"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {/* ================= BRANDING ================= */}
        <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
          <h2 className="text-xl font-bold">Branding & Pricing</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Tagline
              </label>
              <input
                type="text"
                value={branding.tagline}
                onChange={(e) =>
                  setBranding({
                    ...branding,
                    tagline: e.target.value,
                  })
                }
                className="w-full border rounded-xl px-4 py-3"
                placeholder="Enterprise tagline"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Description
              </label>
              <textarea
                value={branding.description}
                onChange={(e) =>
                  setBranding({
                    ...branding,
                    description: e.target.value,
                  })
                }
                className="w-full border rounded-xl px-4 py-3 h-24"
                placeholder="Enterprise description"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Default Session Price (₹)
              </label>
              <input
                type="number"
                value={branding.defaultPricing}
                onChange={(e) =>
                  setBranding({
                    ...branding,
                    defaultPricing: Number(e.target.value),
                  })
                }
                className="w-full border rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Logo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setBranding({
                    ...branding,
                    logo: e.target.files?.[0] || null,
                  })
                }
                className="w-full border rounded-xl px-4 py-3"
              />
              {branding.logoUrl && (
                <img
                  src={branding.logoUrl}
                  alt="Logo preview"
                  className="mt-2 h-12"
                />
              )}
            </div>
          </div>
        </div>

        {/* ================= PREFERENCES ================= */}
        <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
          <h2 className="text-xl font-bold">
            Operational Preferences
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border rounded-xl">
              <span>Allow Consultant Custom Pricing</span>
              <input
                type="checkbox"
                checked={preferences.allowConsultantPricing}
                onChange={() =>
                  setPreferences({
                    ...preferences,
                    allowConsultantPricing:
                      !preferences.allowConsultantPricing,
                  })
                }
                className="w-5 h-5"
              />
            </div>

            <div className="flex justify-between items-center p-4 border rounded-xl">
              <span>Auto Assign Sessions</span>
              <input
                type="checkbox"
                checked={preferences.autoAssignSessions}
                onChange={() =>
                  setPreferences({
                    ...preferences,
                    autoAssignSessions:
                      !preferences.autoAssignSessions,
                  })
                }
                className="w-5 h-5"
              />
            </div>
          </div>
        </div>

        {/* ================= DOCUMENTS ================= */}
        <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <FileText className="text-blue-600" />
            <h2 className="text-xl font-bold">
              Enterprise Documents
            </h2>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Upload Documents
            </label>
            <input
              type="file"
              multiple
              onChange={(e) =>
                setDocuments(Array.from(e.target.files || []))
              }
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

          {/* Existing Docs */}
          {existingDocs.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-gray-600">
                Existing Documents
              </h3>
              {existingDocs.map((doc, i) => (
                <p key={i} className="text-sm text-gray-600">
                  📄 {doc}
                </p>
              ))}
            </div>
          )}

          {/* New Docs */}
          {documents.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-gray-600">
                New Documents to Upload
              </h3>
              {documents.map((doc, i) => (
                <p key={i} className="text-sm text-blue-600">
                  📄 {doc.name}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* ================= VERIFICATION ================= */}
        <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-blue-600" />
            <h2 className="text-xl font-bold">
              Verification Status
            </h2>
          </div>

          <span
            className={`inline-block px-4 py-2 text-sm font-semibold rounded-full ${
              verificationStatus === "APPROVED"
                ? "bg-green-100 text-green-700"
                : verificationStatus === "REJECTED"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {verificationStatus}
          </span>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => fetchSettings()}
            disabled={saving}
            className="px-6 py-3 border rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>

      </div>
    </Layout>
  );
};

export default EnterpriseSettings;