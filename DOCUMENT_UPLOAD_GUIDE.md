# Document & Photo Upload Implementation Guide

## Overview
Complete implementation for uploading photos, KYC documents, and certificates in the consultant profile system.

## Backend Endpoints

### 1. Profile Picture Upload
**Endpoint:** `POST /consultant/upload-profile-pic`
- **Purpose:** Upload consultant profile picture
- **Max Size:** No explicit limit (Cloudinary default: 100MB)
- **Supported Formats:** jpg, jpeg, png, gif, webp
- **Response:** `{ message, profile_pic, consultant }`

**Example Request:**
```javascript
const formData = new FormData();
formData.append("file", imageFile);

const response = await consultantsApi.uploadProfilePic(imageFile);
```

---

### 2. KYC Documents Upload
**Endpoint:** `POST /consultant/upload-kyc`
- **Purpose:** Upload KYC verification documents
- **Max Files:** 5 per request
- **Supported Formats:** pdf, jpg, jpeg, png, doc, docx
- **Required Fields:**
  - `files` (multipart array)
  - `documentType` (optional): 'document', 'id_proof', 'address_proof'
- **Response:** 
```json
{
  "message": "KYC documents uploaded successfully",
  "documents": [
    {
      "id": 1,
      "name": "filename.pdf",
      "url": "https://...",
      "public_id": "...",
      "uploaded_at": "2025-02-26T...",
      "type": "document"
    }
  ],
  "kyc_status": "SUBMITTED"
}
```

**Example Usage:**
```javascript
const files = [file1, file2];
const result = await consultantsApi.uploadKycDoc(files, "document");
```

---

### 3. Certificates Upload
**Endpoint:** `POST /consultant/upload-certificates`
- **Purpose:** Upload professional certificates and credentials
- **Max Files:** 10 per request
- **Supported Formats:** pdf, jpg, jpeg, png, doc, docx
- **Optional Metadata:**
  - `issuer`: Organization name (e.g., "Google", "AWS")
  - `issueDate`: Date YYYY-MM-DD
  - `expiryDate`: Date YYYY-MM-DD
  - `credentialId`: Certification ID number
- **Response:**
```json
{
  "message": "Certificates uploaded successfully",
  "certificates": [
    {
      "id": 1708948932000,
      "name": "GCP-Certification.pdf",
      "url": "https://...",
      "public_id": "...",
      "uploaded_at": "2025-02-26T...",
      "issuer": "Google",
      "issue_date": "2024-01-15",
      "expiry_date": "2026-01-15",
      "credential_id": "GCP-123456"
    }
  ]
}
```

**Example Usage:**
```javascript
const files = [certFile];
const metadata = {
  issuer: "Google",
  issueDate: "2024-01-15",
  expiryDate: "2026-01-15",
  credentialId: "GCP-123456"
};
const result = await consultantsApi.uploadCertificate(files, metadata);
```

---

## Frontend Implementation

### 1. API Methods (frontend/services/api.ts)

```typescript
uploadProfilePic: async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post(
    "/consultant/upload-profile-pic",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
}

uploadKycDoc: async (files: File[], documentType?: string) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (documentType) formData.append("documentType", documentType);
  
  const response = await api.post("/consultant/upload-kyc", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

uploadCertificate: async (files: File[], metadata?: any) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (metadata) {
    if (metadata.issuer) formData.append("issuer", metadata.issuer);
    if (metadata.issueDate) formData.append("issueDate", metadata.issueDate);
    if (metadata.expiryDate) formData.append("expiryDate", metadata.expiryDate);
    if (metadata.credentialId) formData.append("credentialId", metadata.credentialId);
  }
  
  const response = await api.post("/consultant/upload-certificates", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

getKycStatus: async () => {
  const response = await api.get("/consultant/kyc-status");
  return response.data;
}

getCertificates: async () => {
  const response = await api.get("/consultant/certificates");
  return response.data;
}

deleteKycDocument: async (documentId: number | string) => {
  const response = await api.delete(`/consultant/kyc-documents/${documentId}`);
  return response.data;
}

deleteCertificate: async (certificateId: string | number) => {
  const response = await api.delete(`/consultant/certificates/${certificateId}`);
  return response.data;
}
```

### 2. DocumentUpload Component

**Location:** `frontend/components/DocumentUpload.tsx`

**Props:**
- `onUpload`: Function to handle file upload
- `uploadType`: "kyc" or "certificate"
- `maxFiles`: Maximum number of files (default: 5 for KYC, 10 for certificates)
- `acceptedFormats`: File type restrictions (default: ".pdf,.jpg,.jpeg,.png,.doc,.docx")

**Usage in Profile Component:**

```typescript
import DocumentUpload from "../components/DocumentUpload";
import { consultantsApi } from "../services/api";

// In your ProfilePage or ConsultantProfile component:

const [documents, setDocuments] = useState([]);
const [certificates, setCertificates] = useState([]);

// Load existing documents
useEffect(() => {
  const loadDocuments = async () => {
    const kycStatus = await consultantsApi.getKycStatus();
    const certs = await consultantsApi.getCertificates();
    setDocuments(kycStatus.documents || []);
    setCertificates(certs.certificates || []);
  };
  loadDocuments();
}, []);

// Handle KYC document upload
const handleKycUpload = async (files: File[], metadata?: any) => {
  const result = await consultantsApi.uploadKycDoc(files);
  setDocuments((prev) => [...prev, ...result.documents]);
  return result;
};

// Handle certificate upload
const handleCertificateUpload = async (files: File[], metadata?: any) => {
  const result = await consultantsApi.uploadCertificate(files, metadata);
  setCertificates((prev) => [...prev, ...result.certificates]);
  return result;
};

// In JSX:
<DocumentUpload
  uploadType="kyc"
  onUpload={handleKycUpload}
  maxFiles={5}
/>

<DocumentUpload
  uploadType="certificate"
  onUpload={handleCertificateUpload}
  maxFiles={10}
/>
```

### 3. Display Uploaded Documents

```typescript
// Display KYC Documents
<div className="bg-white rounded-2xl shadow-lg p-8">
  <h3 className="text-xl font-bold mb-4">KYC Documents</h3>
  {documents.length > 0 ? (
    <div className="space-y-2">
      {documents.map((doc: any) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-3 border rounded-lg"
        >
          <div className="flex items-center gap-2">
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {doc.name}
            </a>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {doc.type}
            </span>
          </div>
          <button
            onClick={() => consultantsApi.deleteKycDocument(doc.id)}
            className="text-red-600 hover:bg-red-50 p-1 rounded"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-gray-500">No KYC documents uploaded yet</p>
  )}
</div>

// Display Certificates
<div className="bg-white rounded-2xl shadow-lg p-8">
  <h3 className="text-xl font-bold mb-4">Certificates</h3>
  {certificates.length > 0 ? (
    <div className="space-y-3">
      {certificates.map((cert: any) => (
        <div key={cert.id} className="border rounded-lg p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <a
                href={cert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-semibold"
              >
                {cert.name}
              </a>
              {cert.issuer && (
                <p className="text-sm text-gray-600">Issuer: {cert.issuer}</p>
              )}
              {cert.issue_date && (
                <p className="text-sm text-gray-600">
                  Issue Date: {new Date(cert.issue_date).toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              onClick={() => consultantsApi.deleteCertificate(cert.id)}
              className="text-red-600 hover:bg-red-50 p-1 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-gray-500">No certificates uploaded yet</p>
  )}
</div>
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Selects Files                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              DocumentUpload Component                        │
│  - Validates file count                                     │
│  - Collects metadata (for certificates)                     │
│  - Creates FormData                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Frontend API Method                            │
│  - consultantsApi.uploadKycDoc()                            │
│  - consultantsApi.uploadCertificate()                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend Endpoint                             │
│  - POST /consultant/upload-kyc                             │
│  - POST /consultant/upload-certificates                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Cloudinary Upload                            │
│  - Store file in cloud                                     │
│  - Generate secure URL                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Save Metadata to Database                       │
│  - Store URL, filename, metadata                            │
│  - Update consultant record                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           Return Success Response                           │
│  - Updated documents/certificates                           │
│  - KYC status                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Storage

### Consultant Model
```prisma
model Consultant {
  // ... other fields
  
  profile_pic     String?        // Profile picture URL
  kyc_documents   Json?          // Array of KYC documents
  certificates    Json?          // Array of certificates
  kyc_status      String         // PENDING, SUBMITTED, APPROVED, REJECTED
}
```

### Document Structure
```json
{
  "id": 1,
  "name": "passport.pdf",
  "url": "https://res.cloudinary.com/...",
  "public_id": "consultancy-platform/kyc-documents/...",
  "uploaded_at": "2025-02-26T10:30:00Z",
  "type": "document"
}
```

### Certificate Structure
```json
{
  "id": 1708948932000,
  "name": "GCP-Certification.pdf",
  "url": "https://res.cloudinary.com/...",
  "public_id": "consultancy-platform/certificates/...",
  "uploaded_at": "2025-02-26T10:30:00Z",
  "issuer": "Google",
  "issue_date": "2024-01-15",
  "expiry_date": "2026-01-15",
  "credential_id": "GCP-123456"
}
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "No files provided" | User didn't select files | Prompt user to select files |
| "Max X files allowed" | Too many files selected | Show file count limit |
| "Invalid document type" | Wrong document type | Use valid types from backend |
| "Cloudinary not configured" | Server misconfiguration | Check .env variables |
| "Failed to upload documents" | Network/server error | Retry or contact support |

### Error Handling in Component

```typescript
try {
  const result = await onUpload(files, metadata);
  setUploadResult(result);
  setFiles([]);
} catch (err: any) {
  setError(err.response?.data?.error || err.message || "Upload failed");
}
```

---

## Environment Setup

Required `backend-new/.env`:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Testing Checklist

- [ ] Single file upload (profile picture)
- [ ] Multiple file upload (documents)
- [ ] File validation (format, size)
- [ ] Max file count check
- [ ] Metadata collection (certificates)
- [ ] Error handling and display
- [ ] Success message display
- [ ] Files persist after reload
- [ ] Delete document/certificate
- [ ] KYC status updates
- [ ] Cloudinary integration working

---

## Security Considerations

1. **File Validation**
   - Check file types on both frontend and backend
   - Limit file sizes
   - Scan files for malware

2. **Access Control**
   - Only authenticated users can upload
   - Users can only upload to their own profile
   - Verify user ID matches consultant ID

3. **Data Protection**
   - Store URLs securely
   - Use Cloudinary's security features
   - Don't expose raw file paths

4. **Privacy**
   - Documents should be treated as sensitive
   - Consider access logs
   - Allow document deletion
