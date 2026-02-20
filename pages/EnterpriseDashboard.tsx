import React, { useState } from "react";
import Layout from "../components/Layout";
import { useToast } from "../context/ToastContext";
import {
  Building2,
  Upload,
  UserPlus,
  Globe,
  FileText,
  Users,
  Settings,
} from "lucide-react";

const EnterpriseDashboard: React.FC = () => {
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

  const [inviteEmail, setInviteEmail] = useState("");

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
    addToast("Company profile saved", "success");
  };

  const submitKYC = async () => {
    addToast("KYC documents uploaded", "success");
  };

  const inviteConsultant = async () => {
    if (!inviteEmail) {
      addToast("Enter an email to invite", "error");
      return;
    }
    addToast(`Invitation sent to ${inviteEmail}`, "success");
    setInviteEmail("");
  };

  return (
    <Layout title="Enterprise Consultant Dashboard">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <Building2 size={40} className="text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Enterprise Dashboard
          </h1>
        </div>
        <p className="text-gray-500">
          Manage company details, consultants, pricing, and business verification.
        </p>

        {/* GRID */}
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
              Save Company Profile
            </button>
          </div>

          {/* BUSINESS KYC UPLOAD */}
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
          <div className="bg-white p-8 rounded-3xl shadow-md border space-y-5">
            <div className="flex items-center gap-2">
              <Users className="text-blue-600" />
              <h2 className="text-xl font-bold">Company Representative</h2>
            </div>

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

            <button className="btn-primary w-full">
              Save Representative Info
            </button>
          </div>

          {/* INVITE CONSULTANTS */}
          <div className="bg-white p-8 rounded-3xl shadow-md border space-y-5">
            <div className="flex items-center gap-2">
              <UserPlus className="text-blue-600" />
              <h2 className="text-xl font-bold">Invite Consultants</h2>
            </div>

            <input
              placeholder="Consultant Email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="input"
            />

            <button onClick={inviteConsultant} className="btn-primary w-full">
              Send Invite
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EnterpriseDashboard;
