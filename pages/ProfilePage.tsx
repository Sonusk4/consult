
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../App';
import { consultants as consultantsApi, users } from '../services/api';
import { Consultant } from '../types';
import { Camera, Mail, Phone, Globe, Lock, Bell, User as UserIcon, Save, Loader } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState<Consultant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    domain: '',
    hourly_price: '',
    bio: '',
    languages: '',
    phone: '',
    location: 'Remote' // Default for now
  });

  const handleUserImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('Selected file:', file);
      setUploadingImage(true);
      try {
        console.log('Starting upload for file:', file.name);
        const result = await users.uploadProfilePic(file);
        console.log('Upload result:', result);
        
        // Update user in local storage with new avatar
        const updatedUser = { ...user, avatar: result.avatar };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        addToast("Profile picture updated!", 'success');
        // Force re-render by updating user state if needed
        window.location.reload();
      } catch (err: any) {
        console.error('Upload error:', err);
        addToast("Failed to update profile picture", 'error');
      } finally {
        setUploadingImage(false);
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      if (user?.role === 'CONSULTANT' || user?.role === 'ENTERPRISE_ADMIN') {
        const data = await consultantsApi.getProfile();
        setProfile(data);
        setFormData({
          domain: data.domain || '',
          hourly_price: data.hourly_price?.toString() || '',
          bio: data.bio || '',
          languages: data.languages || '',
          phone: user?.phone || '',
          location: 'Remote'
        });
      }
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (user?.role === 'CONSULTANT' || user?.role === 'ENTERPRISE_ADMIN') {
        await consultantsApi.updateProfile({
          domain: formData.domain,
          hourly_price: formData.hourly_price,
          bio: formData.bio,
          languages: formData.languages
        });
        // Note: Phone update logic needs to be separate if it's on User model
      }
      addToast('Profile updated successfully', 'success');
    } catch (err) {
      addToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
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
                  src={
                    // Show user avatar for regular users, consultant profile_pic for consultants
                    (user?.role === 'CONSULTANT' || user?.role === 'ENTERPRISE_ADMIN') 
                      ? profile?.profile_pic || "https://via.placeholder.com/150"
                      : user?.avatar || "https://via.placeholder.com/150"
                  } 
                  className="w-32 h-32 rounded-3xl border-8 border-white object-cover shadow-lg" 
                  alt="Avatar" 
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
                        ? undefined // Use consultant upload handler (already implemented)
                        : handleUserImageUpload // Use user upload handler
                    } 
                    disabled={uploadingImage} 
                  />
                </label>
              </div>
              <div className="flex space-x-3 mb-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center"
                >
                  {saving ? <Loader className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                  Save Changes
                </button>
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
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Full Name (Read Only)</label>
                    <input type="text" readOnly defaultValue={profile?.name || user?.email?.split('@')[0]} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3.5 text-gray-500 font-medium outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Address (Read Only)</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input type="email" readOnly defaultValue={user?.email} className="w-full bg-gray-100 border-none rounded-2xl pl-12 pr-5 py-3.5 text-gray-500 font-medium outline-none" />
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
                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
