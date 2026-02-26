import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import {
  Building2,
  Globe,
  FileText,
  Users,
  Loader,
  Pencil,
} from "lucide-react";

const CompanyProfile: React.FC = () => {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [companyData, setCompanyData] = useState({
    name: "",
    registration_no: "",
    gst_number: "",
    website: "",
    services_offered: "",
    description: "",
    logo: null as File | null,
    logoUrl: "",
  });

  const [representative, setRepresentative] = useState({
    representative_name: "",
    representative_email: "",
    representative_phone: "",
  });

  const [kycDocs, setKycDocs] = useState<File[]>([]);
  const [existingDocs, setExistingDocs] = useState<string[]>([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/enterprise/settings");
      const data = res.data || {};

      setCompanyData({
        name: data.company_name || "",
        registration_no: data.registration_no || "",
        gst_number: data.gst_number || "",
        website: data.company_website || "",
        services_offered: data.services_offered || "",
        description: data.company_description || data.description || "",
        logo: null,
        logoUrl: data.logo || "",
      });

      setRepresentative({
        representative_name: data.representative_name || "",
        representative_email: data.representative_email || "",
        representative_phone: data.representative_phone || "",
      });

      setExistingDocs(Array.isArray(data.documents) ? data.documents : []);
    } catch (error) {
      console.error("Failed to fetch enterprise profile", error);
      addToast("Failed to load company profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setCompanyData({ ...companyData, [e.target.name]: e.target.value });
  };

  const handleRepInput = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRepresentative({ ...representative, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("company_name", companyData.name);
      formData.append("company_website", companyData.website);
      formData.append("company_description", companyData.description);
      formData.append("registration_no", companyData.registration_no);
      formData.append("gst_number", companyData.gst_number);
      formData.append("services_offered", companyData.services_offered);
      formData.append("representative_name", representative.representative_name);
      formData.append("representative_email", representative.representative_email);
      formData.append("representative_phone", representative.representative_phone);

      if (companyData.logo) {
        formData.append("logo", companyData.logo);
      }

      kycDocs.forEach((doc) => formData.append("documents", doc));

      await api.put("/enterprise/settings", formData);

      addToast("Company profile updated successfully", "success");
      setIsEditing(false);
      setKycDocs([]);
      await fetchProfile();
    } catch (error) {
      console.error("Failed to save company profile", error);
      addToast("Failed to save company profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setKycDocs([]);
    fetchProfile();
  };

  if (loading) {
    return (
      <Layout title="Company Profile">
        <div className="flex justify-center items-center h-[60vh]">
          <Loader className="animate-spin text-blue-600" size={40} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Company Profile">
      <div className="max-w-6xl mx-auto space-y-8 pb-12">

        {/* HEADER */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Building2 size={32} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{companyData.name || "Company Profile"}</h1>
              <p className="text-gray-500">Manage enterprise information and verification</p>
            </div>
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition"
            >
              <Pencil size={18} /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-5 py-2 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:border-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-medium hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {/* COMPANY INFORMATION */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Globe className="text-blue-600" />
            <h2 className="text-xl font-bold">Company Information</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Company Name</label>
              <input
                name="name"
                value={companyData.name}
                onChange={handleCompanyInput}
                disabled={!isEditing}
                placeholder="Company Name"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Registration Number / EIN</label>
              <input
                name="registration_no"
                value={companyData.registration_no}
                onChange={handleCompanyInput}
                disabled={!isEditing}
                placeholder="Registration Number"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">GST / Tax Number</label>
              <input
                name="gst_number"
                value={companyData.gst_number}
                onChange={handleCompanyInput}
                disabled={!isEditing}
                placeholder="GST / Tax Number"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Company Website</label>
              <input
                name="website"
                value={companyData.website}
                onChange={handleCompanyInput}
                disabled={!isEditing}
                placeholder="https://example.com"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Services Offered</label>
              <textarea
                name="services_offered"
                value={companyData.services_offered}
                onChange={handleCompanyInput}
                disabled={!isEditing}
                rows={3}
                placeholder="Type of services offered"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Company Description</label>
              <textarea
                name="description"
                value={companyData.description}
                onChange={handleCompanyInput}
                disabled={!isEditing}
                rows={3}
                placeholder="Company description"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition resize-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Company Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                {companyData.logoUrl ? (
                  <img src={companyData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 font-bold">{companyData.name?.charAt(0) || "C"}</span>
                )}
              </div>
              {isEditing && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setCompanyData({
                      ...companyData,
                      logo: e.target.files ? e.target.files[0] : null,
                    })
                  }
                />
              )}
            </div>
          </div>
        </div>

        {/* BUSINESS KYC DOCUMENTS */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <FileText className="text-blue-600" />
            <h2 className="text-xl font-bold">Business KYC Documents</h2>
          </div>

          {existingDocs.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 font-medium">Uploaded Documents</p>
              <div className="space-y-2">
                {existingDocs.map((doc, index) => (
                  <a
                    key={doc}
                    href={doc}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-blue-600 text-sm hover:underline"
                  >
                    Document {index + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {isEditing && (
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Upload Documents</label>
              <input
                type="file"
                multiple
                onChange={(e) => setKycDocs(Array.from(e.target.files || []))}
              />
              {kycDocs.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {kycDocs.length} new document(s) selected
                </p>
              )}
            </div>
          )}
        </div>

        {/* REPRESENTATIVE DETAILS */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Users className="text-blue-600" />
            <h2 className="text-xl font-bold">Company Representative</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              name="representative_name"
              value={representative.representative_name}
              onChange={handleRepInput}
              disabled={!isEditing}
              placeholder="Full Name"
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
            />

            <input
              name="representative_email"
              value={representative.representative_email}
              onChange={handleRepInput}
              disabled={!isEditing}
              placeholder="Email"
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
            />

            <input
              name="representative_phone"
              value={representative.representative_phone}
              onChange={handleRepInput}
              disabled={!isEditing}
              placeholder="Phone Number"
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
            />
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default CompanyProfile;
