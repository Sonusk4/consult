import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { consultants as consultantsApi, subscriptions } from "../services/api";
import { Consultant } from "../types";
import { Loader, Users } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../App";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const ConsultantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [profile, setProfile] = useState<Consultant | null>(null);
  const [loading, setLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [usage, setUsage] = useState<any>(null);

  // 🔥 Extended Onboarding Data (Frontend Only Fields Included)
  const [onboardingData, setOnboardingData] = useState({

    domain: "",
    hourly_price: "",
    bio: "",
    languages: "",

    // Frontend-only fields
    designation: "",
    years_experience: "",
    education: "",
    availability: "Flexible",

    linkedin: "",
    other_social: "",
  });

  // ✅ Load frontend-only fields from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("consultant_extra");
    if (saved) {
      const parsed = JSON.parse(saved);
      setOnboardingData(parsed);
      setProfilePhoto(parsed.profilePhoto || null);
    }
  }, []);
  useEffect(() => {
    fetchProfile();
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const data = await subscriptions.getUsageMetrics();
      setUsage(data);
    } catch { }
  };

  const fetchProfile = async () => {
    try {
      const data = await consultantsApi.getProfile();
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!onboardingData.domain || !onboardingData.hourly_price) {
      addToast("Domain and Hourly Price required", "error");
      return;
    }

    try {
      // 🔥 Remove frontend-only fields before sending
      const {
        designation,
        years_experience,
        education,
        availability,
        linkedin,
        other_social,


        ...backendData
      } = onboardingData;

      await consultantsApi.register(backendData);

      // Save frontend-only fields locally
      localStorage.setItem(
        "consultant_extra",
        JSON.stringify({
          designation,
          years_experience,
          education,
          availability,
          linkedin,
          other_social,
          profilePhoto,
        })
      );

      addToast("Profile created!", "success");
      fetchProfile();
    } catch {
      addToast("Failed to create profile", "error");
    }
  };

  if (loading) {
    return (
      <Layout title="Expert Portal">
        <div className="flex justify-center items-center h-screen">
          <Loader className="animate-spin text-blue-600" size={40} />
        </div>
      </Layout>
    );
  }

  // 🟡 ONBOARDING PAGE
  if (!profile) {
    return (
      <Layout title="Expert Registration">
        <div className="max-w-2xl mx-auto py-12">
          <div className="bg-white rounded-3xl p-8 shadow-lg">

            <div className="text-center mb-8">
              <Users size={32} className="mx-auto text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold">
                Complete Your Profile
              </h2>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="flex flex-col items-center mb-6">

                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-blue-100 shadow-md bg-gray-100 flex items-center justify-center">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-gray-400">
                      {onboardingData.domain?.charAt(0) || "C"}
                    </span>
                  )}
                </div>

                <label className="mt-3 text-sm text-blue-600 font-semibold cursor-pointer">
                  Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>

              </div>
              <input
                type="text"
                placeholder="Domain (e.g. Tech)"
                className="w-full border rounded-xl px-4 py-3"
                value={onboardingData.domain}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    domain: e.target.value,
                  })
                }
                required
              />

              <input
                type="number"
                placeholder="Hourly Rate"
                className="w-full border rounded-xl px-4 py-3"
                value={onboardingData.hourly_price}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    hourly_price: e.target.value,
                  })
                }
                required
              />

              <textarea
                placeholder="Bio"
                className="w-full border rounded-xl px-4 py-3"
                value={onboardingData.bio}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    bio: e.target.value,
                  })
                }
              />

              <input
                type="text"
                placeholder="Languages"
                className="w-full border rounded-xl px-4 py-3"
                value={onboardingData.languages}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    languages: e.target.value,
                  })
                }
              />

              {/* 🔥 FRONTEND ONLY FIELDS */}

              <input
                type="text"
                placeholder="Designation (Frontend only)"
                className="w-full border rounded-xl px-4 py-3"
                value={onboardingData.designation}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    designation: e.target.value,
                  })
                }
              />

              <input
                type="number"
                placeholder="Years of Experience (Frontend only)"
                className="w-full border rounded-xl px-4 py-3"
                value={onboardingData.years_experience}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    years_experience: e.target.value,
                  })
                }
              />

              <input
                type="text"
                placeholder="Education (Frontend only)"
                className="w-full border rounded-xl px-4 py-3"
                value={onboardingData.education}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    education: e.target.value,
                  })
                }
              />

              <input
                type="url"
                placeholder="LinkedIn Profile (Frontend only)"
                className="w-full border rounded-xl px-4 py-3"
                value={onboardingData.linkedin}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    linkedin: e.target.value,
                  })
                }
              />

              <input
                type="url"
                placeholder="Other Social Media (Instagram / Twitter / Website)"
                className="w-full border rounded-xl px-4 py-3"
                value={onboardingData.other_social}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    other_social: e.target.value,
                  })
                }
              />

              <select
                className="w-full border rounded-xl px-4 py-3"
                value={onboardingData.availability}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    availability: e.target.value,
                  })
                }
              >
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Flexible</option>
                <option>Weekends</option>
              </select>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-xl"
              >
                Create Profile
              </button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  // 🟢 DASHBOARD VIEW
  return (
    <Layout title="Expert Portal">
      <div className="max-w-5xl mx-auto space-y-8">

        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-2">
            {getGreeting()}, {profile.name || user?.name || "Expert"}!
          </h2>

          <div className="space-y-1 text-blue-100">
            <p>
              <b>{profile.domain}</b> Consultant
            </p>
            <p>
              <b>
                {onboardingData.designation || profile.domain || "Consultant"}
              </b>
            </p>

            <p>
              {onboardingData.years_experience || "0"} years experience
            </p>

            <p>
              Languages: {profile.languages || "English"}
            </p>

            <p>
              Availability: {onboardingData.availability}
            </p>

            <p>
              Rate: <b>₹{profile.hourly_price}/hr</b>
            </p>
            {onboardingData.linkedin && (
              <p>LinkedIn: <a href={onboardingData.linkedin} target="_blank" className="text-blue-400 hover:underline">View Profile</a></p>
            )}
            {onboardingData.other_social && (
              <p>Other Social: <a href={onboardingData.other_social} target="_blank" className="text-blue-400 hover:underline">View Profile</a></p>
            )}

            {onboardingData.education && (
              <p>Education: {onboardingData.education}</p>
            )}
          </div>
        </div>

        {/* ================= USAGE LIMITS ================= */}
        {usage && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border mt-6">
            <h2 className="text-2xl font-bold mb-6">Subscription Usage</h2>
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="flex-1 bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">Monthly Chat Messages</h3>
                <div className="flex justify-between text-sm mb-2 font-medium">
                  <span>{usage.chat_messages_used} Used</span>
                  <span>{usage.chat_limit} Total</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (usage.chat_messages_used / usage.chat_limit) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex-1 bg-green-50 p-6 rounded-2xl border border-green-100">
                <h3 className="font-semibold text-green-900 mb-2">Days Remaining</h3>
                <div className="text-3xl font-bold text-green-700">
                  {usage.days_remaining}
                </div>
                <p className="text-sm text-green-800 mt-1">days left on {usage.plan} plan</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default ConsultantDashboard;