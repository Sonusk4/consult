import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, XCircle, Clock, FileText, Eye } from "lucide-react";
import { consultants } from "../services/api";

interface ConsultantDoc {
  id: number;
  name: string;
  url: string;
  status: string;
  uploaded_at: string;
}

interface PendingConsultant {
  id: number;
  userId: number;
  type?: string;
  domain?: string;
  hourly_price?: number;
  is_verified: boolean;
  kyc_status: string;
  profile_pic?: string;
  user: {
    id: number;
    email: string;
    name: string;
    created_at: string;
  };
  documents: Array<{
    id: number;
    documentType: string;
    documentUrl: string;
    status: string;
    uploadedAt: string;
  }>;
}

export default function VerificationManagementPage() {
  const [consultantList, setConsultantList] = useState<PendingConsultant[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<PendingConsultant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const data = await consultants.getPendingVerification();
      setConsultantList(Array.isArray(data) ? data : []);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load pending verifications");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (consultantId: number) => {
    try {
      setProcessing(true);
      // Use the admin API to verify the consultant
      const { api } = await import("../services/api");
      await api.put(`/admin/consultants/${consultantId}/verify`);
      setConsultantList((prev) => prev.filter((c) => c.id !== consultantId));
      setSelectedConsultant(null);
      alert("✅ Consultant approved successfully!");
    } catch (err: any) {
      alert("Failed to approve: " + (err.response?.data?.error || err.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedConsultant || !rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    try {
      setProcessing(true);
      const { api } = await import("../services/api");
      await api.put(`/admin/consultants/${selectedConsultant.id}/reject`, {
        rejectionReason: rejectReason,
      });
      setConsultantList((prev) => prev.filter((c) => c.id !== selectedConsultant.id));
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedConsultant(null);
      alert("Consultant rejected.");
    } catch (err: any) {
      alert("Failed to reject: " + (err.response?.data?.error || err.message));
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; Icon: any }> = {
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", Icon: Clock },
      SUBMITTED: { bg: "bg-blue-100", text: "text-blue-800", Icon: Clock },
      APPROVED: { bg: "bg-green-100", text: "text-green-800", Icon: CheckCircle },
      REJECTED: { bg: "bg-red-100", text: "text-red-800", Icon: XCircle },
    };
    const c = config[status] || config.PENDING;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        <c.Icon className="w-3.5 h-3.5" />
        {status}
      </span>
    );
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="page-title">Verification Management</h1>
        <p className="page-subtitle">
          Review and approve consultant applications and KYC documents.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-700" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{consultantList.length}</p>
          <p className="text-sm text-gray-600 mt-1">Pending Review</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-700" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {consultantList.reduce((a, c) => a + (c.documents?.length || 0), 0)}
          </p>
          <p className="text-sm text-gray-600 mt-1">Documents to Review</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-700" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {consultantList.filter((c) => c.documents?.length > 0).length}
          </p>
          <p className="text-sm text-gray-600 mt-1">With Documents</p>
        </div>
      </div>

      {/* Main content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-red-600">{error}</p>
        </div>
      ) : consultantList.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">No pending verifications right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {consultantList.map((consultant) => (
            <div key={consultant.id} className="bg-white rounded-xl border overflow-hidden">
              {/* Consultant header */}
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {consultant.profile_pic ? (
                    <img src={consultant.profile_pic} className="w-12 h-12 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                      {(consultant.user.name || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{consultant.user.name}</h3>
                    <p className="text-sm text-gray-600">{consultant.user.email}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {consultant.domain || "No domain"} · Applied {formatDate(consultant.user.created_at)}
                    </p>
                  </div>
                </div>
                {getStatusBadge(consultant.kyc_status)}
              </div>

              {/* Profile info */}
              <div className="px-6 py-3 bg-gray-50 border-b grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-gray-500">Type:</span> <span className="font-medium">{consultant.type || "N/A"}</span></div>
                <div><span className="text-gray-500">Domain:</span> <span className="font-medium">{consultant.domain || "N/A"}</span></div>
                <div><span className="text-gray-500">Hourly Rate:</span> <span className="font-medium">₹{consultant.hourly_price || "N/A"}/hr</span></div>
              </div>

              {/* Documents */}
              <div className="px-6 py-4 border-b">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  KYC Documents ({consultant.documents?.length || 0})
                </h4>
                {!consultant.documents || consultant.documents.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No documents uploaded yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {consultant.documents.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-3 bg-gray-50 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{doc.documentType}</p>
                          <p className="text-xs text-gray-500">{doc.uploadedAt ? formatDate(doc.uploadedAt) : ""}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(doc.status)}
                          {doc.documentUrl && (
                            <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200">
                              <Eye className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-6 py-4 flex gap-3">
                <button
                  onClick={() => handleApprove(consultant.id)}
                  disabled={processing}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-medium text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    setSelectedConsultant(consultant);
                    setShowRejectModal(true);
                  }}
                  disabled={processing}
                  className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 font-medium text-sm"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Reject Consultant</h2>
            <p className="text-gray-600 mb-4 text-sm">
              Rejecting <strong>{selectedConsultant?.user.name}</strong>. Provide a reason:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border rounded-lg p-3 mb-4 min-h-24 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              placeholder="Explain why this application is being rejected..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                  setSelectedConsultant(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium text-sm"
              >
                {processing ? "Processing..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
