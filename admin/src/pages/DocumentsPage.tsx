import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, XCircle, FileText, Eye } from "lucide-react";
import { documents } from "../services/api";

interface Document {
  id: number;
  userId: number;
  consultantId?: number;
  documentType: string;
  documentUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  rejectionReason?: string;
  uploadedAt?: string;
  verifiedAt?: string;
  userName?: string;
  userEmail?: string;
  user?: {
    id: number;
    email: string;
    name: string;
  };
  verifier?: {
    id: number;
    email: string;
    name: string;
  };
}

const DocumentsPage: React.FC = () => {
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("PENDING");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (filterStatus) {
      setFilteredDocuments(
        allDocuments.filter((doc) => doc.status === filterStatus)
      );
    } else {
      setFilteredDocuments(allDocuments);
    }
  }, [filterStatus, allDocuments]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await documents.getAll();
      setAllDocuments(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (doc: Document) => {
    setSelectedDocument(doc);
    setRejectReason("");
    setVerifyNotes("");
    setShowModal(true);
  };

  const handleApprove = async () => {
    if (!selectedDocument) return;

    setActionLoading(true);
    setActionError("");
    try {
      await documents.verify(selectedDocument.id, verifyNotes);
      await fetchDocuments();
      setShowModal(false);
      setSelectedDocument(null);
    } catch (err: any) {
      setActionError(
        err.response?.data?.error || "Failed to verify document"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDocument || !rejectReason) {
      setActionError("Rejection reason is required");
      return;
    }

    setActionLoading(true);
    setActionError("");
    try {
      await documents.reject(selectedDocument.id, rejectReason);
      await fetchDocuments();
      setShowModal(false);
      setSelectedDocument(null);
    } catch (err: any) {
      setActionError(err.response?.data?.error || "Failed to reject document");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending Review
          </span>
        );
      case "APPROVED":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Document Verification</h2>
        <p className="text-muted-foreground mt-2">
          Review and verify user documents for compliance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold mt-1">
                {allDocuments.filter((d) => d.status === "PENDING").length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold mt-1">
                {allDocuments.filter((d) => d.status === "APPROVED").length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold mt-1">
                {allDocuments.filter((d) => d.status === "REJECTED").length}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["PENDING", "APPROVED", "REJECTED", "ALL"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status === "ALL" ? "" : status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${(status === "ALL" && !filterStatus) ||
                filterStatus === status
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
          >
            {status === "ALL" ? "All Documents" : status}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      )}

      {/* Documents List */}
      {!loading && filteredDocuments.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-medium">User</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Document Type</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Uploaded</th>
                <th className="px-6 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="border-b hover:bg-muted/50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{doc.user?.name || doc.userName || "N/A"}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.user?.email || doc.userEmail || ""}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{doc.documentType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(doc.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {doc.uploadedAt ? formatDate(doc.uploadedAt) : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleVerify(doc)}
                      disabled={doc.status !== "PENDING"}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      <Eye className="h-4 w-4" />
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredDocuments.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
          <p className="text-muted-foreground">No documents found</p>
        </div>
      )}

      {/* Verification Modal */}
      {showModal && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="border-b p-6">
              <h3 className="text-lg font-bold">Review Document</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedDocument.documentType} from {selectedDocument.user?.name || selectedDocument.userName || "N/A"}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Document Viewer */}
              <div>
                <p className="text-sm font-medium mb-3">Document Preview</p>
                <div className="border rounded-lg bg-muted/50 p-4">
                  <a
                    href={selectedDocument.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Eye className="h-4 w-4" />
                    Open PDF in new tab
                  </a>
                </div>
              </div>

              {/* User Info */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">User Information</p>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    {selectedDocument.user?.name || selectedDocument.userName || "N/A"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {selectedDocument.user?.email || selectedDocument.userEmail || "N/A"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Uploaded:</span>{" "}
                    {selectedDocument.uploadedAt ? formatDate(selectedDocument.uploadedAt) : "N/A"}
                  </p>
                </div>
              </div>

              {/* Action Error */}
              {actionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <div>{actionError}</div>
                </div>
              )}

              {/* Verification Notes */}
              <div>
                <p className="text-sm font-medium mb-2">Verification Notes</p>
                <textarea
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Optional notes for approval..."
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                />
              </div>

              {/* Rejection Reason */}
              <div>
                <p className="text-sm font-medium mb-2">Rejection Reason</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection (if rejecting)..."
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border hover:bg-muted transition-colors disabled:opacity-50"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={actionLoading || !rejectReason}
              >
                {actionLoading ? "Processing..." : "Reject"}
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={actionLoading}
              >
                {actionLoading ? "Processing..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
