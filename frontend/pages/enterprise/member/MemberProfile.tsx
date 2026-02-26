import React, { useState, useEffect } from "react";
import Layout from "../../../components/Layout";
import { useAuth } from "../../../App";
import api from "../../../services/api";
import {
  Edit2,
  Save,
  X,
  Camera,
  Mail,
  Phone,
  MapPin,
  Star,
  Briefcase,
  AlertCircle,
  Calendar,
  Award,
  DollarSign,
  Globe,
  GraduationCap,
  CheckCircle,
  Clock,
  FileText,
  User,
} from "lucide-react";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  bio: string;
  expertise: string[];
  availability: string;
  profile_photo: string;
  designation: string;
  languages: string;
  hourly_rate: number | null;
  years_experience: number | null;
  education: string;
}

const MemberProfile: React.FC = () => {
  const { user, loading, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [profileInfo, setProfileInfo] = useState<any>(null);

  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
    bio: "",
    expertise: [],
    availability: "Full-time",
    profile_photo: "",
    designation: "",
    languages: "English",
    hourly_rate: null,
    years_experience: null,
    education: "",
  });

  const [tempExpertise, setTempExpertise] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/enterprise/member/profile");
      const { user: userData, profile } = response.data;

      setProfileInfo(profile);
      setProfileData({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        bio: profile?.bio || "",
        expertise: profile?.expertise || [],
        availability: profile?.availability || "Full-time",
        profile_photo: userData.profile_photo || userData.avatar || "",
        designation: profile?.designation || "Enterprise Team Member",
        languages: profile?.languages || "English",
        hourly_rate: profile?.hourly_rate || null,
        years_experience: profile?.years_experience || null,
        education: profile?.education || "",
      });

      fetchReviews();
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get("/reviews/member");
      const reviews = Array.isArray(response.data) ? response.data : [];
      setTotalReviews(reviews.length);

      if (reviews.length > 0) {
        const avgRating =
          reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
        setAverageRating(avgRating);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddExpertise = () => {
    if (tempExpertise.trim() && profileData.expertise.length < 15) {
      setProfileData((prev) => ({
        ...prev,
        expertise: [...prev.expertise, tempExpertise.trim()],
      }));
      setTempExpertise("");
    }
  };

  const handleRemoveExpertise = (index: number) => {
    setProfileData((prev) => ({
      ...prev,
      expertise: prev.expertise.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingImage(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post("/user/upload-profile-pic", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const newAvatar = response.data.avatar || response.data.profile_pic;
        setProfileData((prev) => ({
          ...prev,
          profile_photo: newAvatar,
        }));

        // Update user context
        if (user) {
          const updatedUser = { ...user, profile_photo: newAvatar };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }

        setMessage("Profile picture updated successfully!");
        setTimeout(() => setMessage(""), 3000);
      } catch (error: any) {
        setMessage("Failed to upload image");
        console.error("Upload error:", error);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      await api.patch("/enterprise/member/profile", {
        name: profileData.name,
        phone: profileData.phone,
        bio: profileData.bio,
        expertise: profileData.expertise,
        availability: profileData.availability,
        profile_photo: profileData.profile_photo,
        designation: profileData.designation,
        languages: profileData.languages,
        hourly_rate: profileData.hourly_rate
          ? parseFloat(profileData.hourly_rate.toString())
          : null,
        years_experience: profileData.years_experience
          ? parseInt(profileData.years_experience.toString())
          : null,
        education: profileData.education,
      });

      setMessage("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setMessage(""), 3000);

      // Refresh profile to get latest data
      await fetchProfile();
    } catch (error: any) {
      setMessage(error.response?.data?.error || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchProfile();
    setMessage("");
  };

  if (loading || !profileData.email) {
    return (
      <Layout title="My Profile">
        <div className="p-8">Loading profile...</div>
      </Layout>
    );
  }

  return (
    <Layout title="My Profile">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              <Edit2 size={18} />
              Edit Profile
            </button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
              >
                <Save size={18} />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.includes("successfully")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <AlertCircle size={20} />
            {message}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Side - Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-24"></div>

            <div className="px-6 pb-6 -mt-12">
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
                  {profileData.profile_photo ? (
                    <img
                      src={profileData.profile_photo}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white text-3xl font-bold">
                      {profileData.name?.[0]?.toUpperCase() || "M"}
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition">
                  {uploadingImage ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <Camera size={16} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>

              <h2 className="text-xl font-bold text-gray-900">
                {profileData.name || "Your Name"}
              </h2>
              <p className="text-gray-600 text-sm">
                {profileData.designation}
              </p>

              {/* Rating Section */}
              {totalReviews > 0 && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <div className="text-yellow-500 flex">
                    {"★".repeat(Math.floor(averageRating))}
                    {"☆".repeat(5 - Math.floor(averageRating))}
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    {averageRating.toFixed(1)} ({totalReviews} reviews)
                  </span>
                </div>
              )}

              {/* Verification Status */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold">
                  {user?.is_verified ? (
                    <span className="text-green-600 flex items-center gap-2">
                      <CheckCircle size={16} />
                      Verified Member
                    </span>
                  ) : (
                    <span className="text-orange-600 flex items-center gap-2">
                      <Clock size={16} />
                      Pending Verification
                    </span>
                  )}
                </p>
              </div>

              {/* Contact Info */}
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-start gap-2 text-gray-600">
                  <Mail size={16} className="mt-1" />
                  <span className="break-all">{profileData.email}</span>
                </div>
                {profileData.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={16} />
                    <span>{profileData.phone}</span>
                  </div>
                )}
                {profileData.languages && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Globe size={16} />
                    <span>{profileData.languages}</span>
                  </div>
                )}
                {profileData.hourly_rate && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign size={16} />
                    <span>${profileData.hourly_rate}/hour</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Briefcase size={20} className="text-blue-600" />
                Professional Bio
              </h3>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleInputChange}
                  placeholder="Write a brief introduction about yourself..."
                  rows={5}
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {profileData.bio || "No bio provided yet."}
                </p>
              )}
            </div>

            {/* Professional Details */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Award size={20} className="text-blue-600" />
                Professional Details
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {profileData.years_experience !== null && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Experience</p>
                    <p className="font-semibold text-gray-900">
                      {profileData.years_experience} years
                    </p>
                  </div>
                )}
                {profileData.availability && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Availability</p>
                    <p className="font-semibold text-gray-900">
                      {profileData.availability}
                    </p>
                  </div>
                )}
                {profileData.education && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                      <GraduationCap size={16} />
                      Education
                    </p>
                    <p className="font-semibold text-gray-900">
                      {profileData.education}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Expertise Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Star size={20} className="text-blue-600" />
                Areas of Expertise
              </h3>
              {isEditing ? (
                <div>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={tempExpertise}
                      onChange={(e) => setTempExpertise(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddExpertise()}
                      placeholder="Add skill..."
                      className="flex-1 border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddExpertise}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileData.expertise.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {skill}
                        <button
                          onClick={() => handleRemoveExpertise(index)}
                          className="hover:text-blue-900"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profileData.expertise.length > 0 ? (
                    profileData.expertise.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No expertise added yet.</p>
                  )}
                </div>
              )}
            </div>

            {/* Editable Fields in Edit Mode */}
            {isEditing && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <User size={20} className="text-blue-600" />
                    Basic Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block font-semibold mb-2">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={profileData.name}
                        onChange={handleInputChange}
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleInputChange}
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">Bio</label>
                      <textarea
                        name="bio"
                        value={profileData.bio}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Write a brief bio"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">Profile Photo</label>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold overflow-hidden">
                          {profileData.profile_photo ? (
                            <img
                              src={profileData.profile_photo}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            profileData.name?.[0]?.toUpperCase()
                          )}
                        </div>
                        <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer font-semibold">
                          {uploadingImage ? (
                            <>
                              <Clock size={18} className="animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Camera size={18} />
                              Change Photo
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Briefcase size={20} className="text-blue-600" />
                    Professional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-2">Designation</label>
                      <input
                        type="text"
                        name="designation"
                        value={profileData.designation}
                        onChange={handleInputChange}
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Senior Consultant"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        name="years_experience"
                        value={profileData.years_experience || ""}
                        onChange={handleInputChange}
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 5"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">Education</label>
                      <input
                        type="text"
                        name="education"
                        value={profileData.education}
                        onChange={handleInputChange}
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., MBA, IIT Delhi"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">Languages</label>
                      <input
                        type="text"
                        name="languages"
                        value={profileData.languages}
                        onChange={handleInputChange}
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., English, Hindi"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">
                        Hourly Rate (₹)
                      </label>
                      <input
                        type="number"
                        name="hourly_rate"
                        value={profileData.hourly_rate || ""}
                        onChange={handleInputChange}
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">Availability</label>
                      <select
                        name="availability"
                        value={profileData.availability}
                        onChange={handleInputChange}
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Flexible">Flexible</option>
                        <option value="Weekends">Weekends</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Expertise */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Award size={20} className="text-blue-600" />
                    Expertise & Skills
                  </h3>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tempExpertise}
                        onChange={(e) => setTempExpertise(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleAddExpertise();
                          }
                        }}
                        className="flex-1 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add an expertise (press Enter or click Add)"
                      />
                      <button
                        onClick={handleAddExpertise}
                        disabled={
                          !tempExpertise.trim() ||
                          profileData.expertise.length >= 15
                        }
                        className="bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profileData.expertise.length > 0 ? (
                        profileData.expertise.map((skill, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                          >
                            {skill}
                            <button
                              onClick={() => handleRemoveExpertise(index)}
                              className="hover:bg-blue-200 rounded-full p-1"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500">No expertise added yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MemberProfile;
