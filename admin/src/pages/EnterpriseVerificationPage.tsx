import React, { useState, useEffect } from "react";
import { Clock, CheckCircle2, XCircle, Building2, Mail, Users } from "lucide-react";
import { enterprises } from "../services/api";

interface PendingEnterprise {
  id: number;
  name: string;
  registration_no?: string;
  gst_number?: string;
  website?: string;
  description?: string;
  status: string;
  created_at: string;
  owner: {
    id: number;
    name?: string;
    email?: string;
  };
  members?: Array<{
    id: number;
    name?: string;
    email?: string;
  }>;
}

const EnterpriseVerificationPage: React.FC = () => {
  const [enterpriseList, setEnterpriseList] = useState<PendingEnterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEnterprise, setSelectedEnterprise] = useState<PendingEnterprise | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingEnterprises();
  }, []);

  const fetchPendingEnterprises = async () => {
    try {
      setLoading(true);
      const data = await enterprises.getPending();
      setEnterpriseList(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load pending enterprises");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedEnterprise) return;

    try {
      setProcessingId(selectedEnterprise.id);
      await enterprises.verify(selectedEnterprise.id, verificationNotes);
      
      // Refresh the list
      await fetchPendingEnterprises();
      setSelectedEnterprise(null);
      setVerificationNotes("");
    } catch (err: any) {
      alert("Failed to verify: " + (err.response?.data?.error || err.message));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    if (!selectedEnterprise) return;

    try {
      setProcessingId(selectedEnterprise.id);
      await enterprises.reject(selectedEnterprise.id, rejectionReason);
      
      // Refresh the list
      await fetchPendingEnterprises();
      setSelectedEnterprise(null);
      setRejectionReason("");
    } catch (err: any) {
      alert("Failed to reject: " + (err.response?.data?.error || err.message));
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const stats = [
    { label: "Pending Verifications", value: enterpriseList.length, icon: Clock, variant: "warning" as const },
    { label: "Total Pending", value: enterpriseList.length, icon: Building2, variant: "info" as const },
  ];

  const variantColors = {
    info: "bg-blue-100 text-blue-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    destructive: "bg-red-100 text-red-700",
  };

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="page-title">Enterprise Verification</h1>
        <p className="page-subtitle">Review and verify enterprise registrations and business details.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${variantColors[stat.variant]}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enterprises List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Pending Verifications</h2>
            </div>

            {loading ? (
              <div className="p-6 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                <p className="text-gray-600 mt-2">Loading...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-600">{error}</div>
            ) : enterpriseList.length === 0 ? (
              <div className="p-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="text-gray-600">All enterprises verified!</p>
              </div>
            ) : (
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {enterpriseList.map((enterprise) => (
                  <div
                    key={enterprise.id}
                    onClick={() => setSelectedEnterprise(enterprise)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedEnterprise?.id === enterprise.id
                        ? "bg-blue-50 border-l-4 border-blue-600"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <p className="font-medium text-gray-900">{enterprise.name}</p>
                    <p className="text-sm text-gray-600">Owner: {enterprise.owner.name || enterprise.owner.email}</p>
                    <p className="text-xs text-gray-500 mt-1">GST: {enterprise.gst_number || "N/A"}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Applied: {formatDate(enterprise.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-2">
          {selectedEnterprise ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {selectedEnterprise.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{selectedEnterprise.description}</p>
              </div>

              {/* Business Info */}
              <div className="px-6 py-4 border-b">
                <h3 className="font-semibold text-gray-900 mb-3">Business Information</h3>
                <div className="space-y-2 text-sm grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Registration No:</span>
                    <p className="font-medium text-gray-900">{selectedEnterprise.registration_no || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">GST Number:</span>
                    <p className="font-medium text-gray-900">{selectedEnterprise.gst_number || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Website:</span>
                    <p className="font-medium text-gray-900 truncate">
                      {selectedEnterprise.website ? (
                        <a href={selectedEnterprise.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {selectedEnterprise.website}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Applied Date:</span>
                    <p className="font-medium text-gray-900">{formatDate(selectedEnterprise.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              <div className="px-6 py-4 border-b">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Primary Owner
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium text-gray-900">{selectedEnterprise.owner.name || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium text-gray-900">{selectedEnterprise.owner.email || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              {selectedEnterprise.members && selectedEnterprise.members.length > 0 && (
                <div className="px-6 py-4 border-b">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team Members ({selectedEnterprise.members.length})
                  </h3>
                  <div className="space-y-2 text-sm max-h-[150px] overflow-y-auto">
                    {selectedEnterprise.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium text-gray-900">{member.name || "N/A"}</p>
                          <p className="text-xs text-gray-600">{member.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification Section */}
              <div className="px-6 py-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-4">Verification Decision</h3>

                <div className="space-y-4">
                  {/* Verification Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Notes
                    </label>
                    <textarea
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                      placeholder="Add any verification notes..."
                      rows={3}
                    />
                  </div>

                  {/* Rejection Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason (if rejecting)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-sm"
                      placeholder="Provide reason for rejection..."
                      rows={3}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleVerify}
                      disabled={processingId === selectedEnterprise.id}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {processingId === selectedEnterprise.id ? "Processing..." : "Approve"}
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={processingId === selectedEnterprise.id}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      {processingId === selectedEnterprise.id ? "Processing..." : "Reject"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select an enterprise to review details and make a verification decision.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnterpriseVerificationPage;
