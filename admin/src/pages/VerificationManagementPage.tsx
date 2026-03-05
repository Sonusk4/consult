import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, XCircle, Clock, FileText, Eye, Upload } from "lucide-react";
import { consultants } from "../services/api";

interface PendingConsultant {
  id: number;
  userId: number;
  type?: string;
  domain?: string;
  hourly_price?: number;
  is_verified: boolean;
  kyc_status: string;
  profile_pic?: string;
  kyc_documents?: Array<{
    id: number;
    name: string;
    url: string;
    type: string;
    status: string;
    rejection_reason?: string;
    uploaded_at: string;
  }>;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  // Per-document rejection modal state
  const [docRejectModal, setDocRejectModal] = useState<{
    consultantId: number;
    docId: number;
    docName: string;
    docType: string;
  } | null>(null);
  const [docRejectReason, setDocRejectReason] = useState("");

  // Profile-level rejection modal
  const [profileRejectModal, setProfileRejectModal] = useState<PendingConsultant | null>(null);
  const [profileRejectReason, setProfileRejectReason] = useState("");

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

  // Approve entire profile (only if all docs are approved)
  const handleApproveProfile = async (consultantId: number) => {
    try {
      setProcessing(true);
      const { api } = await import("../services/api");
      await api.put(`/admin/consultants/${consultantId}/verify`);
      setConsultantList((prev) => prev.filter((c) => c.id !== consultantId));
      alert("✅ Consultant approved successfully! Approval email sent.");
    } catch (err: any) {
      alert("Failed to approve: " + (err.response?.data?.error || err.message));
    } finally {
      setProcessing(false);
    }
  };

  // Reject entire profile
  const handleRejectProfile = async () => {
    if (!profileRejectModal || !profileRejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    try {
      setProcessing(true);
      const { api } = await import("../services/api");
      await api.put(`/admin/consultants/${profileRejectModal.id}/reject`, {
        rejectionReason: profileRejectReason,
      });
      setConsultantList((prev) => prev.filter((c) => c.id !== profileRejectModal.id));
      setProfileRejectModal(null);
      setProfileRejectReason("");
      alert("Consultant rejected. Rejection email sent.");
    } catch (err: any) {
      alert("Failed to reject: " + (err.response?.data?.error || err.message));
    } finally {
      setProcessing(false);
    }
  };

  // Approve a single document
  const handleApproveDoc = async (consultantId: number, docId: number) => {
    try {
      setProcessing(true);
      const result = await consultants.approveDocument(consultantId, docId);
      // Update the local state with the updated documents
      setConsultantList((prev) =>
        prev.map((c) => {
          if (c.id === consultantId && result.allDocuments) {
            return { ...c, kyc_documents: result.allDocuments };
          }
          return c;
        })
      );
      alert("✅ Document approved!");
    } catch (err: any) {
      alert("Failed to approve document: " + (err.response?.data?.error || err.message));
    } finally {
      setProcessing(false);
    }
  };

  // Reject a single document
  const handleRejectDoc = async () => {
    if (!docRejectModal || !docRejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    try {
      setProcessing(true);
      const result = await consultants.rejectDocument(
        docRejectModal.consultantId,
        docRejectModal.docId,
        docRejectReason
      );
      // Update the local state
      setConsultantList((prev) =>
        prev.map((c) => {
          if (c.id === docRejectModal.consultantId && result.allDocuments) {
            return { ...c, kyc_documents: result.allDocuments, kyc_status: "REJECTED" };
          }
          return c;
        })
      );
      setDocRejectModal(null);
      setDocRejectReason("");
      alert("Document rejected. Rejection email sent to consultant.");
    } catch (err: any) {
      alert("Failed to reject document: " + (err.response?.data?.error || err.message));
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

  const getDocTypeBadge = (type: string) => {
    if (type === "certificate") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
          📜 Certificate
        </span>
      );
    } else if (type === "identity_proof") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
          🪪 Identity Proof
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
        📄 Document
      </span>
    );
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  // Check if all docs for a consultant are approved
  const allDocsApproved = (consultant: PendingConsultant) => {
    const docs = consultant.kyc_documents || [];
    return docs.length > 0 && docs.every((d) => d.status === "APPROVED");
  };

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="page-title">Verification Management</h1>
        <p className="page-subtitle">
          Review documents individually, then approve the consultant profile once all documents pass.
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
            {consultantList.reduce((a, c) => a + (c.kyc_documents?.length || 0), 0)}
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
            {consultantList.filter((c) => allDocsApproved(c)).length}
          </p>
          <p className="text-sm text-gray-600 mt-1">Ready to Approve</p>
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
        <div className="space-y-6">
          {consultantList.map((consultant) => {
            const docs = consultant.kyc_documents || [];
            const allApproved = allDocsApproved(consultant);
            const hasPendingDocs = docs.some((d) => d.status === "PENDING");
            const hasRejectedDocs = docs.some((d) => d.status === "REJECTED");

            return (
              <div key={consultant.id} className="bg-white rounded-xl border overflow-hidden shadow-sm">
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

                {/* Documents — Per Document Review */}
                <div className="px-6 py-4 border-b">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents ({docs.length})
                    {allApproved && docs.length > 0 && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full ml-2">
                        ✅ All Approved
                      </span>
                    )}
                  </h4>
                  {docs.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <p className="text-sm text-yellow-800 font-medium">No documents uploaded yet.</p>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">Cannot approve this profile until both Certificate and Identity Proof documents are uploaded.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {docs.map((doc) => (
                        <div
                          key={doc.id}
                          className={`border rounded-lg p-4 ${doc.status === "REJECTED"
                              ? "bg-red-50 border-red-200"
                              : doc.status === "APPROVED"
                                ? "bg-green-50 border-green-200"
                                : "bg-white border-gray-200"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getDocTypeBadge(doc.type)}
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{doc.name}</p>
                                <p className="text-xs text-gray-500">
                                  Uploaded: {doc.uploaded_at ? formatDate(doc.uploaded_at) : "N/A"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(doc.status || "PENDING")}
                              {doc.url && (
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                                  title="View document"
                                >
                                  <Eye className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Rejection reason if already rejected */}
                          {doc.status === "REJECTED" && doc.rejection_reason && (
                            <div className="mt-2 bg-red-100 rounded px-3 py-2">
                              <p className="text-xs text-red-800">
                                <span className="font-semibold">Rejection reason:</span> {doc.rejection_reason}
                              </p>
                            </div>
                          )}

                          {/* Per-document action buttons */}
                          {doc.status !== "APPROVED" && (
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => handleApproveDoc(consultant.id, doc.id)}
                                disabled={processing}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5 font-medium text-xs"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Approve Doc
                              </button>
                              <button
                                onClick={() =>
                                  setDocRejectModal({
                                    consultantId: consultant.id,
                                    docId: doc.id,
                                    docName: doc.name,
                                    docType: doc.type,
                                  })
                                }
                                disabled={processing}
                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5 font-medium text-xs"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Reject Doc
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Profile-level Actions */}
                <div className="px-6 py-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {allApproved ? (
                        <span className="text-green-700 font-medium">✅ All documents approved. Ready for profile approval.</span>
                      ) : hasPendingDocs ? (
                        <span className="text-yellow-700 font-medium">⏳ Review all documents before approving the profile.</span>
                      ) : hasRejectedDocs ? (
                        <span className="text-red-700 font-medium">❌ Some documents rejected. Waiting for consultant to re-upload.</span>
                      ) : docs.length === 0 ? (
                        <span className="text-yellow-700 font-medium">📄 No documents uploaded yet.</span>
                      ) : null}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApproveProfile(consultant.id)}
                        disabled={processing || !allApproved}
                        className={`px-5 py-2 rounded-lg flex items-center gap-2 font-medium text-sm ${allApproved
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          } disabled:opacity-50`}
                        title={!allApproved ? "Approve all documents first" : "Approve profile"}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve Profile
                      </button>
                      <button
                        onClick={() => {
                          setProfileRejectModal(consultant);
                          setProfileRejectReason("");
                        }}
                        disabled={processing}
                        className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 font-medium text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject All
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Per-Document Reject Modal */}
      {docRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Reject Document</h2>
            <p className="text-gray-600 mb-1 text-sm">
              Rejecting: <strong>{docRejectModal.docName}</strong>
            </p>
            <p className="text-gray-500 mb-4 text-xs">
              {docRejectModal.docType === "certificate"
                ? "📜 Certificate Document"
                : docRejectModal.docType === "identity_proof"
                  ? "🪪 Identity Proof"
                  : "📄 Document"}
              {" "} — The consultant will be emailed with your rejection reason.
            </p>
            <textarea
              value={docRejectReason}
              onChange={(e) => setDocRejectReason(e.target.value)}
              className="w-full border rounded-lg p-3 mb-4 min-h-24 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              placeholder="Explain why this document is being rejected (e.g., 'Image is blurry', 'Document expired', 'Name doesn't match')..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDocRejectModal(null);
                  setDocRejectReason("");
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectDoc}
                disabled={processing || !docRejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium text-sm"
              >
                {processing ? "Processing..." : "Reject & Email Consultant"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile-level Reject Modal */}
      {profileRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Reject Consultant</h2>
            <p className="text-gray-600 mb-4 text-sm">
              Rejecting <strong>{profileRejectModal.user.name}</strong>'s entire application. All documents will be marked as rejected.
            </p>
            <textarea
              value={profileRejectReason}
              onChange={(e) => setProfileRejectReason(e.target.value)}
              className="w-full border rounded-lg p-3 mb-4 min-h-24 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              placeholder="Explain why this application is being rejected..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setProfileRejectModal(null);
                  setProfileRejectReason("");
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectProfile}
                disabled={processing || !profileRejectReason.trim()}
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
