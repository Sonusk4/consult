import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ConsultantKycGate from '../components/ConsultantKycGate';
import useConsultantKycCheck from '../hooks/useConsultantKycCheck';
import { useAuth } from '../App';
import { consultants as consultantsApi, users, subscriptions } from '../services/api';
import { Consultant } from '../types';
import {
  Camera, Mail, Phone, User as UserIcon, Save, Loader,
  Upload, FileText, Shield, Award, X, Check, AlertCircle,
  Eye, Edit2, CheckCircle, Clock, PlusCircle, Star, TrendingUp, Users, MessageSquare, Crown
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { link } from 'node:fs';

// Platform fee constants
const BASE_PLATFORM_FEE_PERCENT = 20;
const PLAN_PLATFORM_FEE_REDUCTION: Record<string, number> = {
  Free: 0,
  Professional: 2,
  Premium: 5,
  Elite: 10,
};

// Badge Components (matching plans page)
const VerifiedBadge = () => (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
    <Check className="w-3 h-3 mr-1" />
    Verified
  </span>
);

const TrustedBadge = () => (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
    <Star className="w-3 h-3 mr-1" />
    Trusted
  </span>
);

const EliteBadge = () => (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
    <TrendingUp className="w-3 h-3 mr-1" />
    Elite
  </span>
);

const FreeBadge = () => (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
    <Users className="w-3 h-3 mr-1" />
    Free
  </span>
);

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { kycStatus, loading: kycLoading, isApprovalSuccess } = useConsultantKycCheck();
  const { addToast } = useToast();
  const [profile, setProfile] = useState<Consultant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Check profile completion
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const profileData = await consultantsApi.getProfile();
        const isIncomplete = !profileData || !profileData.name || !profileData.domain || 
                            !profileData.hourly_price || !profileData.bio || !profileData.languages;
        if (isIncomplete) {
          navigate('/consultant/dashboard', { replace: true });
        }
      } catch (error) {
        navigate('/consultant/dashboard', { replace: true });
      }
    };
    checkProfile();
  }, [navigate]);
  const [usage, setUsage] = useState<any>(null);

  // KYC and Certificate states
  const [kycStatusData, setKycStatusData] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [tempExpertise, setTempExpertise] = useState("");

  // Temporary file storage for uploads (only when editing)
  const [tempProfilePhoto, setTempProfilePhoto] = useState<File | null>(null);
  const [tempProfilePhotoPreview, setTempProfilePhotoPreview] = useState<string | null>(null);
  const [tempKycFiles, setTempKycFiles] = useState<File[]>([]);
  const [tempCertFiles, setTempCertFiles] = useState<File[]>([]);

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
    linkedin: '',
    other_social: '',
    
  });

  const isConsultant = user?.role === 'CONSULTANT' || user?.role === 'ENTERPRISE_ADMIN';

  // ------ Data Fetching ------

  const fetchProfile = async () => {
    try {
      if (isConsultant) {
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
          linkedin: data.linkedin || '',
          other_social: data.other_social || '',
        });
      } else {
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
          linkedin: '',
          other_social: '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchKycAndCertificates = async () => {
    if (!isConsultant) return;
    try {
      const [kycData, certData] = await Promise.all([
        consultantsApi.getKycStatus(),
        consultantsApi.getCertificates(),
      ]);
      setKycStatusData(kycData);
      setCertificates(certData.certificates || []);
    } catch (err) {
      console.error('Failed to load KYC/Certificates', err);
    }
  };

  const fetchUsage = async () => {
    try {
      const data = await subscriptions.getUsageMetrics();
      setUsage(data);
    } catch (error) {
      console.error('Failed to fetch usage metrics:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchKycAndCertificates();
      fetchUsage();
    }
  }, [user]);

  // ------ Handlers ------

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
      // Step 1: Upload pending files if any
      if (tempProfilePhoto) {
        try {
          if (isConsultant) {
            const result = await consultantsApi.uploadProfilePic(tempProfilePhoto);
            // Update sessionStorage for navbar consistency
            if (setUser && user) {
              const updated = { ...user, avatar: result.profile_pic };
              setUser(updated);
              sessionStorage.setItem('user', JSON.stringify(updated));
            }
            const consultantExtra = sessionStorage.getItem('consultant_extra');
            if (consultantExtra) {
              const parsed = JSON.parse(consultantExtra);
              parsed.profilePhoto = result.profile_pic;
              sessionStorage.setItem('consultant_extra', JSON.stringify(parsed));
              setRegistrationPhoto(result.profile_pic);
            }
          } else {
            const result = await users.uploadProfilePic(tempProfilePhoto);
            if (setUser && user) {
              const updated = { ...user, avatar: result.avatar };
              setUser(updated);
              sessionStorage.setItem('user', JSON.stringify(updated));
            }
          }
          setTempProfilePhoto(null);
          setTempProfilePhotoPreview(null);
        } catch (err: any) {
          addToast('Failed to upload profile photo', 'error');
          setSaving(false);
          return;
        }
      }

      // Upload KYC documents if any
      if (tempKycFiles.length > 0) {
        try {
          await consultantsApi.uploadKycDoc(tempKycFiles);
          setTempKycFiles([]);
        } catch (err: any) {
          addToast('Failed to upload KYC documents', 'error');
          setSaving(false);
          return;
        }
      }

      // Upload certificates if any
      if (tempCertFiles.length > 0) {
        try {
          await consultantsApi.uploadCertificate(tempCertFiles);
          setTempCertFiles([]);
        } catch (err: any) {
          addToast('Failed to upload certificates', 'error');
          setSaving(false);
          return;
        }
      }

      // Step 2: Update profile data
      if (isConsultant) {
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
          education: formData.education,
          linkedin: formData.linkedin,
          other_social: formData.other_social
        });
        // Refresh profile data to show latest
        const fresh = await consultantsApi.getProfile();
        setProfile(fresh);
        // Refresh KYC and certificates after save
        await fetchKycAndCertificates();
      } else {
        await users.updateProfile({
          full_name: formData.name,
          phone: formData.phone,
          expertise: formData.expertise,
          availability: formData.availability,
          designation: formData.designation,
          years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
          education: formData.education,
          linkedin: formData.linkedin,
          other_social: formData.other_social
        });
      }
      if (setUser) {
        const updatedUser = { ...user, name: formData.name, phone: formData.phone };
        setUser(updatedUser);
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
      }
      addToast('Profile updated successfully ✓', 'success');
      setIsEditing(false);
    } catch (err) {
      addToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setTempProfilePhotoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Store file for later upload on Save
    setTempProfilePhoto(file);
  };

  const handleKycUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    // Store files for later upload on Save
    setTempKycFiles(Array.from(e.target.files));
  };

  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    // Store files for later upload on Save
    setTempCertFiles(Array.from(e.target.files));
  };

  const handleDeleteKyc = async (docId: number) => {
    try {
      await consultantsApi.deleteKycDocument(docId);
      await fetchKycAndCertificates();
      addToast('KYC document removed', 'success');
    } catch (err) {
      addToast('Failed to delete KYC document', 'error');
    }
  };

  const handleDeleteCert = async (certId: number) => {
    try {
      await consultantsApi.deleteCertificate(certId);
      await fetchKycAndCertificates();
      addToast('Certificate removed', 'success');
    } catch (err) {
      addToast('Failed to delete certificate', 'error');
    }
  };

  // ------ KYC Status ------
  const kycBadge = (status: string) => {
    const map: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      APPROVED: { color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle size={14} />, label: 'Approved' },
      SUBMITTED: { color: 'bg-blue-100 text-blue-700', icon: <Clock size={14} />, label: 'Under Review' },
      REJECTED: { color: 'bg-red-100 text-red-700', icon: <AlertCircle size={14} />, label: 'Rejected' },
      PENDING: { color: 'bg-amber-100 text-amber-700', icon: <Shield size={14} />, label: 'Pending Upload' },
    };
    const s = map[status] || map.PENDING;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${s.color}`}>
        {s.icon} {s.label}
      </span>
    );
  };

  // ------ Rendering ------

  // Load profile photo from registration only
  const [registrationPhoto, setRegistrationPhoto] = useState<string | null>(null);
  
  useEffect(() => {
    const saved = sessionStorage.getItem("consultant_extra");
    if (saved) {
      const parsed = JSON.parse(saved);
      setRegistrationPhoto(parsed.profilePhoto || null);
    }
  }, []);

  const avatarSrc = profile?.profile_pic || registrationPhoto || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'U')}&background=3b82f6&color=fff&size=128`;

  if (loading) {
    return (
      <Layout title="My Profile">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader className="animate-spin text-blue-600" size={36} />
        </div>
      </Layout>
    );
  }

  return (
    <ConsultantKycGate kycStatus={kycStatus} showSuccessModal={isApprovalSuccess}>
      <Layout title="My Profile">
        <div className="max-w-4xl mx-auto space-y-6 pb-12">

          {/* ─── Hero Card ───────────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative">
          {/* Plan Badge - Top Right Corner */}
          <div className="absolute top-4 right-4 z-10">
            {usage?.plan && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                usage.plan === 'Elite' ? 'bg-purple-100 text-purple-800' :
                usage.plan === 'Premium' ? 'bg-blue-100 text-blue-800' :
                usage.plan === 'Professional' ? 'bg-indigo-100 text-indigo-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                <Crown className="w-3 h-3 mr-1" />
                {usage.plan} Plan
              </span>
            )}
          </div>
          
          {/* Gradient Cover with Profile Info */}
          <div className="h-36 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 relative">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_#fff_0%,_transparent_60%)]" />
            
            {/* Profile Info - Centered at top, overlapping photo area */}
            <div className="absolute top-4 left-0 right-0 flex justify-center">
              <div className="text-center text-white z-10 bg-black/20 backdrop-blur-sm rounded-lg px-6 py-3">
                <h1 className="text-xl font-bold drop-shadow-lg mb-1">
                  {formData.name || user?.email?.split('@')[0] || 'Your Name'}
                </h1>
                <div className="flex items-center justify-center gap-4 text-xs">
                  <span className="text-blue-100 drop-shadow flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    {isConsultant && profile?.domain ? profile.domain : 'Domain'}
                  </span>
                  <span className="text-blue-200 drop-shadow flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    {user?.email || 'email@example.com'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 sm:px-8 pb-8">
            {/* Avatar + Actions row */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 mb-6 gap-4">
              {/* Avatar */}
              <div className="relative group w-28 h-28 shrink-0">
                {tempProfilePhotoPreview && (
                  <div className="absolute -top-2 -right-2 bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                    <Clock size={12} /> Photo pending
                  </div>
                )}
                <img
                  src={tempProfilePhotoPreview || avatarSrc}
                  alt="Profile photo"
                  className="w-28 h-28 rounded-2xl border-4 border-white object-cover shadow-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=U&background=3b82f6&color=fff&size=128`;
                  }}
                />
                {isEditing && (
                  <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
                    <><Camera className="text-white" size={22} /><span className="text-white text-xs mt-1 font-semibold">Change</span></>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>

              {/* Edit/Save */}
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        // Clear pending files on cancel
                        setTempProfilePhoto(null);
                        setTempProfilePhotoPreview(null);
                        setTempKycFiles([]);
                        setTempCertFiles([]);
                        fetchProfile();
                      }}
                      className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-60"
                    >
                      {saving ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                      Save
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-700 transition-all"
                  >
                    <Edit2 size={16} /> Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Profile Form */}
            <div className="grid md:grid-cols-2 gap-5">
              {/* Full Name */}
              <Field label="Full Name" icon={<UserIcon size={16} />}>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Your full name"
                  className={inputClass(isEditing)}
                />
              </Field>

              {/* Email */}
              <Field label="Email Address" icon={<Mail size={16} />}>
                <input
                  type="email"
                  readOnly
                  value={user?.email || ''}
                  className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-500 font-medium cursor-not-allowed"
                />
              </Field>

              {/* Phone */}
              <Field label="Phone Number" icon={<Phone size={16} />}>
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="+91 98765 43210"
                  className={inputClass(isEditing)}
                />
              </Field>

              {/* Consultant-specific */}
              {isConsultant && (
                <>
                  <Field label="Domain / Expertise">
                    <input
                      name="domain"
                      type="text"
                      value={formData.domain}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="e.g. Legal, Medical, Tech"
                      className={inputClass(isEditing)}
                    />
                  </Field>

                  <Field label="Hourly Rate (₹)">
                    <input
                      name="hourly_price"
                      type="number"
                      value={formData.hourly_price}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="e.g. 1500"
                      className={inputClass(isEditing)}
                    />
                    {isConsultant && formData.hourly_price && profile && (
                      <div className="mt-2 text-xs text-green-600 bg-green-50 p-3 rounded-lg">
                        <div className="flex justify-between mb-1.5">
                          <span>Hourly Rate:</span>
                          <span className="font-semibold">₹{parseFloat(formData.hourly_price).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-red-600 mb-1.5">
                          <span>Platform Fee ({(() => {
                            const currentPlan = (profile as any)?.currentPlan || (profile as any)?.subscription_plan || 'Free';
                            const reduction = PLAN_PLATFORM_FEE_REDUCTION[currentPlan] || 0;
                            return Math.max(0, BASE_PLATFORM_FEE_PERCENT - reduction);
                          })()}%):</span>
                          <span className="font-semibold">-₹{(() => {
                            const currentPlan = (profile as any)?.currentPlan || (profile as any)?.subscription_plan || 'Free';
                            const reduction = PLAN_PLATFORM_FEE_REDUCTION[currentPlan] || 0;
                            const effectiveFee = Math.max(0, BASE_PLATFORM_FEE_PERCENT - reduction);
                            const feeAmount = (parseFloat(formData.hourly_price) * effectiveFee) / 100;
                            return feeAmount.toFixed(2);
                          })()}</span>
                        </div>
                        <div className="border-t border-green-200 pt-1.5 flex justify-between font-semibold">
                          <span>You'll Receive:</span>
                          <span>₹{(() => {
                            const currentPlan = (profile as any)?.currentPlan || (profile as any)?.subscription_plan || 'Free';
                            const reduction = PLAN_PLATFORM_FEE_REDUCTION[currentPlan] || 0;
                            const effectiveFee = Math.max(0, BASE_PLATFORM_FEE_PERCENT - reduction);
                            const takeHome = parseFloat(formData.hourly_price) * (1 - effectiveFee / 100);
                            return Math.max(0, takeHome).toFixed(2);
                          })()}/hr</span>
                        </div>
                      </div>
                    )}
                  </Field>

                  <Field label="Languages Spoken">
                    <input
                      name="languages"
                      type="text"
                      value={formData.languages}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="e.g. English, Hindi"
                      className={inputClass(isEditing)}
                    />
                  </Field>

                  {/* Missing Fields from Dashboard */}
                  <Field label="Designation">
                    <input
                      name="designation"
                      type="text"
                      value={formData.designation}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="e.g. Senior Developer"
                      className={inputClass(isEditing)}
                    />
                  </Field>

                  <Field label="Years of Experience">
                    <input
                      name="years_experience"
                      type="number"
                      value={formData.years_experience}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="e.g. 5"
                      className={inputClass(isEditing)}
                    />
                  </Field>

                  <Field label="Education">
                    <input
                      name="education"
                      type="text"
                      value={formData.education}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="e.g. B.Tech Computer Science"
                      className={inputClass(isEditing)}
                    />
                  </Field>

                  <Field label="Availability">
                    <select
                      name="availability"
                      value={formData.availability}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={inputClass(isEditing)}
                    >
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Flexible</option>
                      <option>Weekends</option>
                    </select>
                  </Field>

                  <div className="md:col-span-2">
                    <Field label="Bio / Introduction">
                      <textarea
                        name="bio"
                        rows={3}
                        value={formData.bio}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="Tell clients about your expertise and experience..."
                        className={`${inputClass(isEditing)} resize-none`}
                      />
                    </Field>
                  </div>

                  <Field label="LinkedIn Profile">
                    <input
                      name="linkedin"
                      type="text"
                      value={formData.linkedin}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className={inputClass(isEditing)}
                    />
                  </Field>

                  <Field label="Other Social Media">
                    <input
                      name="other_social"
                      type="text"
                      value={formData.other_social}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Twitter, Instagram, or website URL"
                      className={inputClass(isEditing)}
                    />
                  </Field>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ─── KYC + Certificates (Consultant only) ────────────────────── */}
        {isConsultant && (
          <div className="grid md:grid-cols-2 gap-6">

            {/* KYC Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-2 rounded-xl">
                    <Shield className="text-blue-600" size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">KYC Verification</h3>
                    <p className="text-xs text-gray-500">Identity proof documents</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing && tempKycFiles.length > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1">
                      <Clock size={12} /> {tempKycFiles.length} pending
                    </span>
                  )}
                  {kycStatusData && kycBadge(kycStatusData.kyc_status)}
                </div>
              </div>

              {/* Existing KYC docs */}
              {kycStatusData?.documents?.length > 0 ? (
                <div className="space-y-2">
                  {kycStatusData.documents.map((doc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="bg-blue-50 p-1.5 rounded-lg shrink-0">
                          <FileText className="text-blue-500" size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{doc.name}</p>
                          <p className="text-xs text-gray-400">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          onClick={() => window.open(doc.url, '_blank')}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteKyc(doc.id)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-2xl">
                  <Shield className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-sm text-gray-500">No documents uploaded yet</p>
                  <p className="text-xs text-gray-400 mt-1">Upload your ID proof to get verified</p>
                </div>
              )}

              {/* Pending files preview */}
              {isEditing && tempKycFiles.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <p className="text-xs font-semibold text-amber-600">Pending upload on Save:</p>
                  {Array.from(tempKycFiles).map((file, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                      <Clock className="text-amber-500" size={14} />
                      <span className="text-xs text-amber-700 truncate">{file.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              <label className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                isEditing
                  ? 'cursor-pointer bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-100'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400'
                }`}>
                <PlusCircle size={16} /> {isEditing ? 'Add KYC Document' : 'Edit to Add KYC'}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleKycUpload}
                  className="hidden"
                  multiple
                  disabled={!isEditing}
                />
              </label>
              <p className="text-xs text-gray-400 text-center">{isEditing ? 'Accepted: PDF, JPG, PNG (uploads on Save)' : 'Click Edit to add documents'}</p>
            </div>

            {/* Certificates Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-100 p-2 rounded-xl">
                    <Award className="text-purple-600" size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Certificates</h3>
                    <p className="text-xs text-gray-500">{certificates.length} uploaded</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing && tempCertFiles.length > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1">
                      <Clock size={12} /> {tempCertFiles.length} pending
                    </span>
                  )}
                  {certificates.length > 0 && (
                    <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      {certificates.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Existing certs */}
              {certificates.length > 0 ? (
                <div className="space-y-2">
                  {certificates.map((cert: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="bg-purple-50 p-1.5 rounded-lg shrink-0">
                          <Award className="text-purple-500" size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{cert.name}</p>
                          <p className="text-xs text-gray-400">
                            {cert.issuer !== 'Not specified' ? `${cert.issuer} · ` : ''}
                            {new Date(cert.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          onClick={() => window.open(cert.url, '_blank')}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteCert(cert.id)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-2xl">
                  <Award className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-sm text-gray-500">No certificates uploaded yet</p>
                  <p className="text-xs text-gray-400 mt-1">Add your qualifications and achievements</p>
                </div>
              )}

              {/* Pending files preview */}
              {isEditing && tempCertFiles.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <p className="text-xs font-semibold text-amber-600">Pending upload on Save:</p>
                  {Array.from(tempCertFiles).map((file, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                      <Clock className="text-amber-500" size={14} />
                      <span className="text-xs text-amber-700 truncate">{file.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              <label className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                isEditing
                  ? 'cursor-pointer bg-purple-600 text-white hover:bg-purple-700 shadow-sm shadow-purple-100'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400'
                }`}>
                <PlusCircle size={16} /> {isEditing ? 'Add Certificate' : 'Edit to Add Certificate'}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleCertUpload}
                  className="hidden"
                  multiple
                  disabled={!isEditing}
                />
              </label>
              <p className="text-xs text-gray-400 text-center">{isEditing ? 'Accepted: PDF, JPG, PNG (uploads on Save)' : 'Click Edit to add certificates'}</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
    </ConsultantKycGate>
  );
};



// ─── Helpers ────────────────────────────────────────────────────────────────

const inputClass = (editing: boolean) =>
  `w-full rounded-xl px-4 py-3 font-medium outline-none transition-all ${editing
    ? 'bg-white border-2 border-blue-300 focus:border-blue-500 text-gray-900'
    : 'bg-gray-50 text-gray-700 cursor-default'
  }`;

const Field: React.FC<{ label: string; icon?: React.ReactNode; children: React.ReactNode }> = ({
  label,
  icon,
  children,
}) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-xs font-black text-gray-400 uppercase tracking-widest">
      {icon}
      {label}
    </label>
    {children}
  </div>
);

export default ProfilePage;
