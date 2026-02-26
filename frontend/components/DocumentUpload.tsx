import React, { useState } from "react";
import { Upload, X, FileText, Award, AlertCircle, CheckCircle } from "lucide-react";

interface DocumentUploadProps {
  onUpload: (
    files: File[],
    metadata?: {
      issuer?: string;
      issueDate?: string;
      expiryDate?: string;
      credentialId?: string;
    }
  ) => Promise<any>;
  uploadType: "kyc" | "certificate";
  maxFiles?: number;
  acceptedFormats?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUpload,
  uploadType,
  maxFiles = uploadType === "kyc" ? 5 : 10,
  acceptedFormats = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState({
    issuer: "",
    issueDate: "",
    expiryDate: "",
    credentialId: "",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalFiles = [...files, ...newFiles];

      if (totalFiles.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      setFiles(totalFiles);
      setError("");
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMetadata((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one file");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const result = await onUpload(
        files,
        uploadType === "certificate" ? metadata : undefined
      );
      setUploadResult(result);
      setFiles([]);
      setMetadata({ issuer: "", issueDate: "", expiryDate: "", credentialId: "" });
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        {uploadType === "kyc" ? (
          <FileText size={20} className="text-blue-600" />
        ) : (
          <Award size={20} className="text-blue-600" />
        )}
        {uploadType === "kyc" ? "Upload KYC Documents" : "Upload Certificates"}
      </h3>

      {/* File Upload Area */}
      <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center mb-6 hover:border-blue-500 transition cursor-pointer bg-blue-50">
        <input
          type="file"
          multiple
          accept={acceptedFormats}
          onChange={handleFileSelect}
          disabled={uploading || files.length >= maxFiles}
          className="hidden"
          id={`file-input-${uploadType}`}
        />
        <label
          htmlFor={`file-input-${uploadType}`}
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <Upload size={32} className="text-blue-600" />
          <p className="text-gray-700 font-semibold">Click to upload files</p>
          <p className="text-sm text-gray-500">
            Max {maxFiles} files • PDF, JPG, PNG, DOC
          </p>
        </label>
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-3 text-gray-700">
            Selected Files ({files.length}/{maxFiles})
          </h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white p-3 rounded border border-gray-200"
              >
                <div className="flex items-center gap-2 flex-1">
                  <FileText size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-700 truncate flex-1">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="text-red-500 hover:bg-red-50 p-1 rounded"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificate Metadata (only for certificates) */}
      {uploadType === "certificate" && files.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold mb-3 text-gray-700">Certificate Details (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Issuer/Organization
              </label>
              <input
                type="text"
                name="issuer"
                value={metadata.issuer}
                onChange={handleMetadataChange}
                placeholder="e.g., Google, AWS"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Credential ID
              </label>
              <input
                type="text"
                name="credentialId"
                value={metadata.credentialId}
                onChange={handleMetadataChange}
                placeholder="Optional credential ID"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Issue Date
              </label>
              <input
                type="date"
                name="issueDate"
                value={metadata.issueDate}
                onChange={handleMetadataChange}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Expiry Date
              </label>
              <input
                type="date"
                name="expiryDate"
                value={metadata.expiryDate}
                onChange={handleMetadataChange}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {uploadResult && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-700 text-sm font-semibold">
              {uploadResult.message || `${uploadResult.documents ? "KYC documents" : "Certificates"} uploaded successfully!`}
            </p>
            {uploadResult.kyc_status && (
              <p className="text-green-600 text-xs mt-1">
                Status: {uploadResult.kyc_status}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex gap-3">
        <button
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <span className="animate-spin">⏳</span>
              Uploading...
            </>
          ) : (
            <>
              <Upload size={18} />
              Upload {files.length > 0 ? `(${files.length})` : ""}
            </>
          )}
        </button>
        {files.length > 0 && !uploading && (
          <button
            onClick={() => {
              setFiles([]);
              setError("");
            }}
            className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;
