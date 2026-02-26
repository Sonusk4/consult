import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../App';
import { consultants as consultantsApi, users } from '../services/api';
import { Consultant } from '../types';
import { Camera, Mail, Phone, Globe, Lock, Bell, User as UserIcon, Save, Loader, Upload, FileText, Shield, Award, X, Check, AlertCircle, Eye } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState<Consultant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // KYC and Certificate states
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [uploadingKyc, setUploadingKyc] = useState(false);
  const [uploadingCertificates, setUploadingCertificates] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [tempExpertise, setTempExpertise] = useState("");
  
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    hourly_price: '',
    bio: '',
    languages: '',
    phone: '',
    location: 'Remote',
    expertise: [] as string[],
    availability: 'Full-time',
    designation: '',
    years_experience: '',
    education: '',
  });
const handleUserImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];

    setUploadingImage(true);
    try {
      const result = await users.uploadProfilePic(file);

      if (!user) return;

      const updatedUser = {
        ...user,
        avatar: result.avatar
      };

      // ✅ Update React state
      setUser(updatedUser);

      // ✅ Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      addToast("Profile picture updated!", "success");

    } catch (err: any) {
      console.error('Upload error:', err);
      addToast("Failed to update profile picture", "error");
    } finally {
      setUploadingImage(false);
    }
  }
};

  
const handleConsultantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];

    setUploadingImage(true);
    try {
      const result = await consultantsApi.uploadProfilePic(file);

      if (!user) return;

      const updatedUser = {
        ...user,
        avatar: result.profile_pic   // 
      };

      // Update React state
      setUser(updatedUser);

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Refresh profile data to get updated profile_pic
      fetchProfile();

      addToast("Profile picture updated!", "success");

    } catch (err: any) {
      console.error('Consultant upload error:', err);
      addToast("Failed to upload image", "error");
    } finally {
      setUploadingImage(false);
    }
  }
};


  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchKycAndCertificates();
    }
  }, [user]);

  const fetchKycAndCertificates = async () => {
    try {
      if (user?.role === 'CONSULTANT' || user?.role === 'ENTERPRISE_ADMIN') {
        const [kycData, certificatesData] = await Promise.all([
          consultantsApi.getKycStatus(),
          consultantsApi.getCertificates()
        ]);
        setKycStatus(kycData);
        setCertificates(certificatesData.certificates || []);
      }
    } catch (err) {
      console.error("Failed to load KYC/Certificates", err);
    }
  };

  const fetchProfile = async () => {
    try {
      if (user?.role === 'CONSULTANT' || user?.role === 'ENTERPRISE_ADMIN') {
        const data = await consultantsApi.getProfile();
        setProfile(data);
        setFormData({
          name: user?.name || data.name || user?.email?.split('@')[0] || '',
          domain: data.domain || '',
          hourly_price: data.hourly_price?.toString() || '',
          bio: data.bio || '',
          languages: data.languages || '',
          phone: user?.phone || '',
          location: 'Remote',
          expertise: data.expertise || [],
          availability: data.availability || 'Full-time',
          designation: data.designation || '',
          years_experience: data.years_experience?.toString() || '',
          education: data.education || '',
        });
      } else {
        // For regular users, load from user data
        setFormData({
          name: user?.name || user?.email?.split('@')[0] || '',
          domain: '',
          hourly_price: '',
          bio: '',
          languages: '',
          phone: user?.phone || '',
          location: 'Remote',
          expertise: [],
          availability: 'Full-time',
          designation: '',
          years_experience: '',
          education: '',
        });
      }
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddExpertise = () => {
    if (tempExpertise.trim() && formData.expertise.length < 15) {
      setFormData({
        ...formData,
        expertise: [...formData.expertise, tempExpertise.trim()]
      });
      setTempExpertise("");
    }
  };

  const handleRemoveExpertise = (index: number) => {
    setFormData({
      ...formData,
      expertise: formData.expertise.filter((_, i) => i !== index)
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (user?.role === 'CONSULTANT' || user?.role === 'ENTERPRISE_ADMIN') {
        await consultantsApi.updateProfile({
          domain: formData.domain,
          hourly_price: formData.hourly_price,
          bio: formData.bio,
          languages: formData.languages,
          full_name: formData.name,
          phone: formData.phone,
          expertise: formData.expertise,
          availability: formData.availability,
          designation: formData.designation,
          years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
          education: formData.education
        });
      } else {
        // For regular users, update name and phone via a separate user update API
        // We'll need to add this endpoint to the backend
        await consultantsApi.updateProfile({
          full_name: formData.name,
          phone: formData.phone,
          expertise: formData.expertise,
          availability: formData.availability,
          designation: formData.designation,
          years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
          education: formData.education
        });
      }
      
      // Refresh user data to get updated name and phone
      if (setUser) {
        const updatedUser = { ...user, name: formData.name, phone: formData.phone };
        setUser(updatedUser);
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
      }
      
      addToast('Profile updated successfully', 'success');
       setIsEditing(false);
    } catch (err) {
      addToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleKycUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadingKyc(true);
      try {
        await consultantsApi.uploadKycDoc(e.target.files[0]);
        await fetchKycAndCertificates();
        addToast("KYC documents uploaded successfully!", "success");
        setShowKycModal(false);
      } catch (err: any) {
        console.error('KYC upload error:', err);
        addToast("Failed to upload KYC documents", "error");
      } finally {
        setUploadingKyc(false);
      }
    }
  };

  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadingCertificates(true);
      try {
        await consultantsApi.uploadCertificate(e.target.files[0]);
        await fetchKycAndCertificates();
        addToast("Certificates uploaded successfully!", "success");
        setShowCertificateModal(false);
      } catch (err: any) {
        console.error('Certificate upload error:', err);
        addToast("Failed to upload certificates", "error");
      } finally {
        setUploadingCertificates(false);
      }
    }
  };

  const handleDeleteCertificate = async (certificateId: number) => {
    try {
      await consultantsApi.deleteCertificate(certificateId);
      await fetchKycAndCertificates();
      addToast("Certificate deleted successfully", "success");
    } catch (err: any) {
      console.error('Delete certificate error:', err);
      addToast("Failed to delete certificate", "error");
    }
  };

  const handleDeleteKycDocument = async (documentId: number) => {
    try {
      await consultantsApi.deleteKycDocument(documentId);
      await fetchKycAndCertificates();
      addToast("KYC document deleted successfully", "success");
    } catch (err: any) {
      console.error('Delete KYC document error:', err);
      addToast("Failed to delete KYC document", "error");
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-50';
      case 'SUBMITTED': return 'text-blue-600 bg-blue-50';
      case 'REJECTED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getKycStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Check size={16} />;
      case 'SUBMITTED': return <AlertCircle size={16} />;
      case 'REJECTED': return <X size={16} />;
      default: return <Shield size={16} />;
    }
  };

  // KYC Upload Modal
  const KycUploadModal = () => {
    if (!showKycModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999]">
        <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900">Upload KYC Documents</h2>
            <button onClick={() => setShowKycModal(false)} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Upload your identity proof, address proof, and other verification documents. Accepted formats: PDF, JPG, PNG
            </p>
            
            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">Maximum 5 files, 10MB each</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleKycUpload}
                  disabled={uploadingKyc}
                  className="hidden"
                />
              </div>
            </label>

            {uploadingKyc && (
              <div className="flex items-center justify-center py-4">
                <Loader className="animate-spin text-blue-600 mr-2" />
                <span className="text-sm text-gray-600">Uploading...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Certificate Upload Modal
  const CertificateUploadModal = () => {
    if (!showCertificateModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999]">
        <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900">Upload Certificates</h2>
            <button onClick={() => setShowCertificateModal(false)} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Upload your professional certificates, qualifications, and achievements. Accepted formats: PDF, JPG, PNG
            </p>
            
            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-500 transition-colors cursor-pointer">
                <Award className="mx-auto text-gray-400 mb-3" size={32} />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">Maximum 10 files, 10MB each</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleCertificateUpload}
                  disabled={uploadingCertificates}
                  className="hidden"
                />
              </div>
            </label>

            {uploadingCertificates && (
              <div className="flex items-center justify-center py-4">
                <Loader className="animate-spin text-purple-600 mr-2" />
                <span className="text-sm text-gray-600">Uploading...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <Layout title="My Profile"><div className="flex justify-center p-12"><Loader className="animate-spin" /></div></Layout>;

  return (
    <Layout title="My Profile">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header/Cover */}
          <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

          <div className="px-8 pb-8">
            <div className="relative -mt-16 mb-8 flex items-end justify-between">
              <div className="relative group">
                  <img 
                  src={profile?.profile_pic || user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || user?.email}&background=3b82f6&color=fff&size=128`} 
                  className="w-32 h-32 rounded-3xl border-8 border-white object-cover shadow-lg" 
                  alt="Avatar" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${user?.name || user?.email}&background=3b82f6&color=fff&size=128`;
                  }}
                />

                {/* Upload overlay - show for all users */}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl cursor-pointer">
                  {uploadingImage ? <Loader className="text-white animate-spin" /> : <Camera className="text-white" />}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={
                      (user?.role === 'CONSULTANT' || user?.role === 'ENTERPRISE_ADMIN')
                        ? handleConsultantImageUpload
                        : handleUserImageUpload
                    }
                    disabled={uploadingImage} 
                  />
                </label>
              </div>
              <div className="flex space-x-3 mb-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-gray-800 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-gray-900 transition-all"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center"
                  >
                    {saving ? (
                      <Loader className="animate-spin mr-2" size={18} />
                    ) : (
                      <Save className="mr-2" size={18} />
                    )}
                    Save Changes
                  </button>
                )}
              </div>

            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-2">
                <h3 className="font-bold text-gray-900 text-lg">Profile Information</h3>
                <p className="text-sm text-gray-500">Update your account photo and personal details here.</p>
                {/* Navigation links for settings could go here */}
              </div>

              <div className="md:col-span-2 space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Full Name </label>
                    <input 
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}

                    className="w-full bg-gray-50 rounded-2xl px-5 py-3.5"
                  />

                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Address (Read Only)</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input type="email" readOnly defaultValue={user?.email} className="w-full bg-gray-100 border-none rounded-2xl pl-12 pr-5 py-3.5 text-gray-500 font-medium outline-none" disabled={!isEditing} />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Contact Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="+91 1234567890"
                        className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-5 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Consultant Specific Fields */}
                {(user?.role === 'CONSULTANT' || user?.role === 'ENTERPRISE_ADMIN') && (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Hourly Price ($)</label>
                        <input
                          name="hourly_price"
                          type="number"
                          value={formData.hourly_price}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Domain / Expertise</label>
                        <input
                          name="domain"
                          type="text"
                          value={formData.domain}
                          onChange={handleChange}
                          disabled={!isEditing}

                          className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Bio</label>
                      <textarea
                        name="bio"
                        rows={4}
                        value={formData.bio}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder="Tell clients about your experience..."
                      ></textarea>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Languages</label>
                      <input
                        name="languages"
                        type="text"
                        value={formData.languages}
                        onChange={handleChange}
                        disabled={!isEditing}

                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Designation</label>
                        <input
                          name="designation"
                          type="text"
                          value={formData.designation}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="e.g., Senior Consultant"
                          className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Years of Experience</label>
                        <input
                          name="years_experience"
                          type="number"
                          value={formData.years_experience}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="e.g., 5"
                          min="0"
                          className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Education</label>
                        <input
                          name="education"
                          type="text"
                          value={formData.education}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="e.g., MBA, IIT Delhi"
                          className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Availability</label>
                        <select
                          name="availability"
                          value={formData.availability}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Flexible">Flexible</option>
                          <option value="Weekends">Weekends</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Areas of Expertise</label>
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={tempExpertise}
                              onChange={(e) => setTempExpertise(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && handleAddExpertise()}
                              placeholder="Add a skill (press Enter or click Add)"
                              className="flex-1 bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleAddExpertise}
                              disabled={!tempExpertise.trim() || formData.expertise.length >= 15}
                              className="bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:bg-gray-300"
                            >
                              Add
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {formData.expertise.map((skill, index) => (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                              >
                                {skill}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExpertise(index)}
                                  className="hover:bg-blue-200 rounded-full p-1"
                                >
                                  <X size={14} />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {formData.expertise.length > 0 ? (
                            formData.expertise.map((skill, index) => (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm">No expertise added yet.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* KYC Section */}
                {(user?.role === 'CONSULTANT' || user?.role === 'ENTERPRISE_ADMIN') && (
                  <div className="border-t pt-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Shield className="text-blue-600" size={20} />
                        <h3 className="font-bold text-gray-900 text-lg">KYC Verification</h3>
                      </div>
                      {kycStatus && (
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getKycStatusColor(kycStatus.kyc_status)}`}>
                          {getKycStatusIcon(kycStatus.kyc_status)}
                          <span>{kycStatus.kyc_status}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {kycStatus?.documents && kycStatus.documents.length > 0 ? (
                        <div className="space-y-2">
                          {kycStatus.documents.map((doc: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                              <div className="flex items-center space-x-3">
                                <FileText className="text-gray-400" size={16} />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                  <p className="text-xs text-gray-500">Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => window.open(doc.url, '_blank')}
                                  disabled={!isEditing}
                                  className={`p-1 ${!isEditing ? 'text-gray-300 cursor-not-allowed' : 'text-blue-500 hover:text-blue-700'}`}
                                  title="View Document"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteKycDocument(doc.id)}
                                  disabled={!isEditing}
                                  className={`p-1 ${!isEditing ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:text-red-700'}`}
                                  title="Delete Document"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl">
                          <Shield className="mx-auto text-gray-400 mb-3" size={32} />
                          <p className="text-sm text-gray-500 mb-4">No KYC documents uploaded yet</p>
                        </div>
                      )}
                      
                      <button
                        onClick={() => setShowKycModal(true)}
                        disabled={!isEditing}
                        className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2 ${
                          !isEditing 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <Upload size={18} />
                        <span>Upload KYC Documents</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Certificates Section */}
                {(user?.role === 'CONSULTANT' || user?.role === 'ENTERPRISE_ADMIN') && (
                  <div className="border-t pt-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Award className="text-purple-600" size={20} />
                        <h3 className="font-bold text-gray-900 text-lg">Certificates & Qualifications</h3>
                      </div>
                      <span className="text-sm text-gray-500">{certificates.length} uploaded</span>
                    </div>
                    
                    <div className="space-y-3">
                      {certificates.length > 0 ? (
                        <div className="space-y-2">
                          {certificates.map((cert: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                              <div className="flex items-center space-x-3">
                                <Award className="text-purple-400" size={16} />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{cert.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {cert.issuer !== "Not specified" && `${cert.issuer} • `}
                                    Uploaded {new Date(cert.uploaded_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => window.open(cert.url, '_blank')}
                                  disabled={!isEditing}
                                  className={`p-1 ${!isEditing ? 'text-gray-300 cursor-not-allowed' : 'text-blue-500 hover:text-blue-700'}`}
                                  title="View Certificate"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCertificate(cert.id)}
                                  disabled={!isEditing}
                                  className={`p-1 ${!isEditing ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:text-red-700'}`}
                                  title="Delete Certificate"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl">
                          <Award className="mx-auto text-gray-400 mb-3" size={32} />
                          <p className="text-sm text-gray-500 mb-4">No certificates uploaded yet</p>
                        </div>
                      )}
                      
                      <button
                        onClick={() => setShowCertificateModal(true)}
                        disabled={!isEditing}
                        className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2 ${
                          !isEditing 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        <Upload size={18} />
                        <span>Upload Certificates</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <KycUploadModal />
      <CertificateUploadModal />
    </Layout>
  );
};

export default ProfilePage;
