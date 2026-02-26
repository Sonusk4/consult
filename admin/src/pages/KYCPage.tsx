import React, { useState, useEffect } from "react";
import { Clock, CheckCircle2, XCircle, Eye, Check, X, FileText, Mail } from "lucide-react";
import { consultants, documents } from "../services/api";

interface ConsultantWithDocs {
  id: number;
  userId: number;
  type?: string;
  domain?: string;
  hourly_price?: number;
  is_verified: boolean;
  user: {
    id: number;
    email: string;
    name: string;
    created_at: string;
  };
  documents?: Array<{
    id: number;
    userId: number;
    documentType: string;
    documentUrl: string;
    status: string;
    uploadedAt: string;
  }>;
}

const KYCPage: React.FC = () => {
  const [consultantList, setConsultantList] = useState<ConsultantWithDocs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedConsultant, setSelectedConsultant] = useState<ConsultantWithDocs | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingConsultants();
  }, []);

  const fetchPendingConsultants = async () => {
    try {
      setLoading(true);
      const data = await consultants.getPendingVerification();
      setConsultantList(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load pending consultants");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (documentId: number) => {
    if (!selectedConsultant) return;

    try {
      setVerifyingId(documentId);
      await documents.verify(documentId);
      
      // Refresh the list
      await fetchPendingConsultants();
      setSelectedConsultant(null);
    } catch (err: any) {
      alert("Failed to verify: " + (err.response?.data?.error || err.message));
    } finally {
      setVerifyingId(null);
    }
  };

  const handleReject = async (documentId: number) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    if (!selectedConsultant) return;

    try {
      setVerifyingId(documentId);
      await documents.reject(documentId, rejectionReason);
      
      // Refresh the list
      await fetchPendingConsultants();
      setSelectedConsultant(null);
      setRejectionReason("");
    } catch (err: any) {
      alert("Failed to reject: " + (err.response?.data?.error || err.message));
    } finally {
      setVerifyingId(null);
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
    { label: "Pending Verifications", value: consultantList.length, icon: Clock, variant: "warning" as const },
    { label: "Total Consultants", value: consultantList.length, icon: CheckCircle2, variant: "info" as const },
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
        <h1 className="page-title">Consultant Verification</h1>
        <p className="page-subtitle">Review and verify consultant KYC documents and profiles.</p>
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
        {/* Consultants List */}
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
            ) : consultantList.length === 0 ? (
              <div className="p-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="text-gray-600">All consultants verified!</p>
              </div>
            ) : (
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {consultantList.map((consultant) => (
                  <div
                    key={consultant.id}
                    onClick={() => setSelectedConsultant(consultant)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedConsultant?.id === consultant.id
                        ? "bg-blue-50 border-l-4 border-blue-600"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <p className="font-medium text-gray-900">{consultant.user.name}</p>
                    <p className="text-sm text-gray-600">{consultant.user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">{consultant.domain}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Applied: {formatDate(consultant.user.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-2">
          {selectedConsultant ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedConsultant.user.name}
                </h2>
                <p className="text-sm text-gray-600">{selectedConsultant.user.email}</p>
              </div>

              {/* Profile Info */}
              <div className="px-6 py-4 border-b">
                <h3 className="font-semibold text-gray-900 mb-3">Profile Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Domain:</span>
                    <p className="font-medium text-gray-900">{selectedConsultant.domain || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <p className="font-medium text-gray-900">{selectedConsultant.type || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Hourly Rate:</span>
                    <p className="font-medium text-gray-900">
                      ${selectedConsultant.hourly_price || "N/A"}/hour
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Applied On:</span>
                    <p className="font-medium text-gray-900">
                      {formatDate(selectedConsultant.user.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="px-6 py-4 border-b">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents
                </h3>

                {!selectedConsultant.documents || selectedConsultant.documents.length === 0 ? (
                  <p className="text-sm text-gray-600">No documents uploaded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedConsultant.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="border rounded-lg p-3 bg-gray-50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900">{doc.documentType}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(doc.uploadedAt)}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            doc.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : doc.status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {doc.status}
                          </span>
                        </div>

                        {doc.status === "PENDING" && (
                          <div className="flex gap-2">
                            <a
                              href={doc.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Document
                            </a>
                            <button
                              onClick={() => handleVerify(doc.id)}
                              disabled={verifyingId === doc.id}
                              className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                              <Check className="h-4 w-4" />
                              {verifyingId === doc.id ? "..." : "Approve"}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rejection Form */}
              {selectedConsultant.documents && selectedConsultant.documents.some((d) => d.status === "PENDING") && (
                <div className="px-6 py-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Reject Application</h3>
                  <div className="space-y-3">
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={3}
                    />
                    <button
                      onClick={() => {
                        const pendingDoc = selectedConsultant.documents.find(d => d.status === "PENDING");
                        if (pendingDoc) handleReject(pendingDoc.id);
                      }}
                      disabled={!rejectionReason.trim() || verifyingId !== null}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      {verifyingId ? "Processing..." : "Reject Application"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 flex items-center justify-center h-[500px]">
              <div className="text-center">
                <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">Select a consultant to review their profile</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYCPage;
