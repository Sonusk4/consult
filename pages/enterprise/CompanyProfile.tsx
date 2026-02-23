import React, { useState } from "react";
import Layout from "../../components/Layout";
import { useToast } from "../../context/ToastContext";
import {
  Building2,
  Upload,
  Globe,
  FileText,
  Users,
} from "lucide-react";

const CompanyProfile: React.FC = () => {
  const { addToast } = useToast();

  const [companyData, setCompanyData] = useState({
    name: "",
    registrationNumber: "",
    website: "",
    services: "",
    description: "",
    logo: null as File | null,
  });

  const [kycDocs, setKycDocs] = useState<File[]>([]);
  const [representative, setRepresentative] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  /* ============== HANDLERS ============== */

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

  const submitCompanyProfile = async () => {
    addToast("Company profile updated successfully", "success");
  };

  const submitKYC = async () => {
    addToast("Business documents uploaded successfully", "success");
  };

  const saveRepresentative = async () => {
    addToast("Representative details saved", "success");
  };

  return (
    <Layout title="Company Profile">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <Building2 size={40} className="text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Company Profile
          </h1>
        </div>
        <p className="text-gray-500">
          Manage your enterprise information, documents, and representative details.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* COMPANY INFORMATION */}
          <div className="bg-white p-8 rounded-3xl shadow-md border space-y-5">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="text-blue-600" />
              <h2 className="text-xl font-bold">Company Information</h2>
            </div>

            <input
              name="name"
              placeholder="Company Name"
              onChange={handleCompanyInput}
              className="input"
            />

            <input
              name="registrationNumber"
              placeholder="Registration / GST / EIN"
              onChange={handleCompanyInput}
              className="input"
            />

            <input
              name="website"
              placeholder="Company Website"
              onChange={handleCompanyInput}
              className="input"
            />

            <textarea
              name="services"
              placeholder="Type of services offered"
              rows={2}
              onChange={handleCompanyInput}
              className="textarea"
            />

            <textarea
              name="description"
              placeholder="Company Description"
              rows={3}
              onChange={handleCompanyInput}
              className="textarea"
            />

            <div>
              <label className="font-semibold text-sm">Company Logo:</label>
              <input
                type="file"
                onChange={(e) =>
                  setCompanyData({
                    ...companyData,
                    logo: e.target.files ? e.target.files[0] : null,
                  })
                }
                className="mt-2"
              />
            </div>

            <button
              onClick={submitCompanyProfile}
              className="btn-primary w-full"
            >
              Save Company Information
            </button>
          </div>

          {/* BUSINESS KYC DOCUMENTS */}
          <div className="bg-white p-8 rounded-3xl shadow-md border space-y-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="text-blue-600" />
              <h2 className="text-xl font-bold">Business KYC Documents</h2>
            </div>

            <p className="text-sm text-gray-500">
              Upload company PAN, registration proof, utility bill, etc.
            </p>

            <input
              type="file"
              multiple
              onChange={(e) => setKycDocs(Array.from(e.target.files || []))}
              className="mt-2"
            />

            <button onClick={submitKYC} className="btn-primary w-full">
              Upload Documents
            </button>
          </div>

          {/* REPRESENTATIVE DETAILS */}
          <div className="bg-white p-8 rounded-3xl shadow-md border space-y-5 md:col-span-2">
            <div className="flex items-center gap-2">
              <Users className="text-blue-600" />
              <h2 className="text-xl font-bold">Company Representative</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                name="fullName"
                placeholder="Full Name"
                onChange={handleRepInput}
                className="input"
              />

              <input
                name="email"
                placeholder="Email"
                onChange={handleRepInput}
                className="input"
              />

              <input
                name="phone"
                placeholder="Phone Number"
                onChange={handleRepInput}
                className="input"
              />
            </div>

            <button
              onClick={saveRepresentative}
              className="btn-primary w-full md:w-auto"
            >
              Save Representative Info
            </button>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default CompanyProfile;
