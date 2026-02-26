import React, { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import { useAuth } from "../../App";
import { useToast } from "../../context/ToastContext";
import { Camera, Wallet, Loader, Pencil } from "lucide-react";

const UserProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    location: "",
  });

  const [originalData, setOriginalData] = useState(formData);

  /* ================= LOAD USER ================= */
  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchWallet();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get("/user/profile");
      const profileData = res.data;
      
      const userData = {
        name: profileData.name || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        bio: profileData.bio || "",
        location: profileData.location || "",
      };

      setFormData(userData);
      setOriginalData(userData);
      setPreviewImage(profileData.avatar || null);
    } catch (err) {
      console.error("Profile fetch failed:", err);
      // Fallback to cached user data
      const userData = {
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
        location: user.location || "",
      };

      setFormData(userData);
      setOriginalData(userData);
      setPreviewImage(user.avatar || null);
    }
  };

  const fetchWallet = async () => {
    try {
      const res = await api.get("/wallet");
      setWalletBalance(res.data.balance || 0);
    } catch (err) {
      console.error("Wallet fetch failed:", err);
    }
  };

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  /* ================= HANDLE IMAGE CHANGE ================= */
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      addToast("Please select an image file", "error");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      addToast("File size must be less than 5MB", "error");
      return;
    }

    // Show preview immediately
    const imageUrl = URL.createObjectURL(file);
    setPreviewImage(imageUrl);

    const formDataImage = new FormData();
    formDataImage.append("file", file);

    try {
      setUploadingImage(true);
      console.log("Uploading file:", file.name);

      const response = await api.post(
        "/user/upload-profile-pic",
        formDataImage,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Upload response:", response.data);
      
      // Use the URL returned from server
      if (response.data.avatar) {
        setPreviewImage(response.data.avatar);
      }
      
      addToast("Profile photo updated successfully!", "success");
    } catch (err: any) {
      console.error("Upload error:", err);
      const errorMsg = err.response?.data?.error || err.message || "Failed to upload photo";
      addToast(errorMsg, "error");
      
      // Revert preview on error
      setPreviewImage(user?.avatar || null);
    } finally {
      setUploadingImage(false);
    }
  };

  /* ================= SAVE PROFILE ================= */
  const handleSave = async () => {
    setLoading(true);
    try {
      // Update profile using /auth/me endpoint
      await api.post("/auth/me", {
        name: formData.name,
        phone: formData.phone,
        bio: formData.bio,
        location: formData.location,
        email: formData.email, // Include email for consistency, even if it's read-only
      });

      addToast("Profile updated successfully!", "success");
      setIsEditing(false);
      setOriginalData(formData);
    } catch (err: any) {
      console.error("Save error:", err);
      const errorMsg = err.response?.data?.error || "Failed to update profile";
      addToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  return (
    <Layout title="My Profile">
      <div className="max-w-5xl mx-auto space-y-8 pb-12">

        {/* ================= PROFILE HEADER ================= */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8">

          {/* PROFILE PICTURE */}
          <div className="relative flex-shrink-0">
            <div className="w-28 h-28 rounded-full bg-gray-100 overflow-hidden border-4 border-white shadow-md flex items-center justify-center">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold bg-gradient-to-br from-blue-100 to-blue-50">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
            </div>

            {isEditing && (
              <>
                <button
                  onClick={handleImageClick}
                  disabled={uploadingImage}
                  className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white shadow-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title="Change profile picture"
                >
                  {uploadingImage ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <Camera size={16} />
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={uploadingImage}
                />
              </>
            )}
          </div>

          {/* USER INFO */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-900">
              {formData.name || "Your Name"}
            </h2>
            <p className="text-gray-500 text-lg mt-1">{formData.email}</p>
            {formData.location && (
              <p className="text-gray-400 text-sm mt-2">📍 {formData.location}</p>
            )}
          </div>

          {/* WALLET BALANCE */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 px-6 py-4 rounded-2xl flex items-center gap-4 border border-blue-200">
            <div className="bg-blue-600 p-3 rounded-full text-white">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Wallet Balance</p>
              <p className="font-bold text-2xl text-blue-900">
                ₹{walletBalance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* ================= PROFILE FORM ================= */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">

          {/* HEADER */}
          <div className="flex justify-between items-center border-b border-gray-200 pb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Personal Information
            </h3>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition"
              >
                <Pencil size={18} />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-5 py-2 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:border-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={loading || uploadingImage}
                  className="bg-blue-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-medium hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading && <Loader size={16} className="animate-spin" />}
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>

          {/* FORM FIELDS */}
          <div className="grid md:grid-cols-2 gap-6">

            {/* Full Name */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Full Name
              </label>
              <input
                name="name"
                value={formData.name}
                disabled={!isEditing}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Email Address
              </label>
              <input
                name="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Phone Number
              </label>
              <input
                name="phone"
                value={formData.phone}
                disabled={!isEditing}
                onChange={handleChange}
                placeholder="Enter your phone number"
                type="tel"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Location
              </label>
              <input
                name="location"
                value={formData.location}
                disabled={!isEditing}
                onChange={handleChange}
                placeholder="Enter your city/location"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
              />
            </div>

          </div>

          {/* Bio */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              About You
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              disabled={!isEditing}
              onChange={handleChange}
              placeholder="Tell us about yourself..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              {formData.bio.length}/500 characters
            </p>
          </div>

        </div>

        {/* ================= ADDITIONAL INFO ================= */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-8">
          <h3 className="text-lg font-bold text-blue-900 mb-4">💡 Tips</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>✓ Keep your profile picture clear and professional</li>
            <li>✓ Add a phone number so consultants can reach you</li>
            <li>✓ Write a detailed bio to help us match you better</li>
            <li>✓ Your wallet balance is used for booking consultations</li>
          </ul>
        </div>

      </div>
    </Layout>
  );
};

export default UserProfilePage;