import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { consultants as consultantsApi, bookings } from "../services/api";
import { Consultant, SessionStatus, Booking } from "../types";
import {
  TrendingUp,
  Users,
  Calendar,
  Clock,
  DollarSign,
  ArrowUpRight,
  CheckCircle,
  Video,
  Loader,
  Save,
  Camera,
  Upload,
  User as UserIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
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
  const [profile, setProfile] = useState<Consultant | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const { addToast } = useToast();
  const [revenueData, setRevenueData] = useState([
    { name: "Mon", revenue: 0 },
    { name: "Tue", revenue: 0 },
    { name: "Wed", revenue: 0 },
    { name: "Thu", revenue: 0 },
    { name: "Fri", revenue: 0 },
    { name: "Sat", revenue: 0 },
    { name: "Sun", revenue: 0 },
  ]);
  const [timePeriod, setTimePeriod] = useState<"7days" | "30days">("7days");

  // Dynamic state for dashboard data
  const [dashboardStats, setDashboardStats] = useState({
    totalSessions: 0,
    totalRevenue: 0,
    averageRating: 0,
    activeClients: 0,
  });
  const [upcomingSessions, setUpcomingSessions] = useState<Booking[]>([]);
  const [todaySlots, setTodaySlots] = useState<any[]>([]);

  // Onboarding State
  const [onboardingData, setOnboardingData] = useState({
    domain: "",
    hourly_price: "",
    bio: "",
    languages: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [kycFileName, setKycFileName] = useState<string>('');

  useEffect(() => {
    fetchProfile();
    fetchRevenueData();
    fetchDashboardStats();
    fetchUpcomingSessions();
    fetchTodaySlots();
  }, []);

  useEffect(() => {
    fetchRevenueData();
  }, [timePeriod]);

  const fetchRevenueData = async () => {
    try {
      // Check if user is logged in
      if (!user) {
        console.log("No user logged in, skipping revenue fetch");
        setRevenueData([
          { name: "Mon", revenue: 0 },
          { name: "Tue", revenue: 0 },
          { name: "Wed", revenue: 0 },
          { name: "Thu", revenue: 0 },
          { name: "Fri", revenue: 0 },
          { name: "Sat", revenue: 0 },
          { name: "Sun", revenue: 0 },
        ]);
        return;
      }

      // Fetch real earnings data from API
      const earnings = await consultantsApi.getConsultantEarnings(timePeriod);

      // If no earnings data, return empty data structure
      if (!earnings || earnings.length === 0) {
        const emptyData =
          timePeriod === "7days"
            ? [
              { name: "Mon", revenue: 0 },
              { name: "Tue", revenue: 0 },
              { name: "Wed", revenue: 0 },
              { name: "Thu", revenue: 0 },
              { name: "Fri", revenue: 0 },
              { name: "Sat", revenue: 0 },
              { name: "Sun", revenue: 0 },
            ]
            : [
              { name: "Week 1", revenue: 0 },
              { name: "Week 2", revenue: 0 },
              { name: "Week 3", revenue: 0 },
              { name: "Week 4", revenue: 0 },
            ];
        setRevenueData(emptyData);
        return;
      }

      setRevenueData(earnings);
    } catch (error) {
      console.error("Failed to fetch revenue data:", error);
      addToast("Failed to load revenue data", "error");
    }
  };

  const fetchDashboardStats = async () => {
    setStatsLoading(true);
    try {
      // Check if user is logged in
      if (!user) {
        console.log("No user logged in, skipping stats fetch");
        setDashboardStats({
          totalSessions: 0,
          totalRevenue: 0,
          averageRating: 0,
          activeClients: 0,
        });
        return;
      }

      // Fetch real dashboard statistics from API
      const stats = await consultantsApi.getDashboardStats();

      setDashboardStats({
        totalSessions: stats.totalSessions,
        totalRevenue: stats.totalRevenue,
        averageRating: stats.averageRating,
        activeClients: stats.activeClients,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      addToast("Failed to load dashboard statistics", "error");
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUpcomingSessions = async () => {
    setSessionsLoading(true);
    try {
      // Check if user is logged in
      if (!user) {
        console.log("No user logged in, skipping session fetch");
        setUpcomingSessions([]);
        return;
      }

      const response = await consultantsApi.getConsultantBookings();
      const upcomingBookings = response.filter(
        (booking: Booking) =>
          booking.status === "UPCOMING" && new Date(booking.date) >= new Date()
      );
      setUpcomingSessions(upcomingBookings.slice(0, 5)); // Show next 5 sessions
    } catch (error) {
      console.error("Failed to fetch upcoming sessions:", error);
      addToast("Failed to load upcoming sessions", "error");
    } finally {
      setSessionsLoading(false);
    }
  };

  const fetchTodaySlots = async () => {
    try {
      // Check if user is logged in
      if (!user) {
        console.log("No user logged in, skipping slots fetch");
        setTodaySlots([]);
        return;
      }

      // Fetch real availability data from API
      const response = await consultantsApi.getConsultantAvailability();

      // Transform API response to match expected format
      const formattedSlots = response.map((slot: any) => ({
        id: slot.id,
        time: slot.time,
        status: slot.status,
      }));

      setTodaySlots(formattedSlots);
    } catch (error) {
      console.error("Failed to fetch today slots:", error);
      addToast("Failed to load today slots", "error");
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await consultantsApi.getProfile();
      setProfile(data);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error("Failed to load profile", err);
        addToast("Failed to load profile data", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingData.domain || !onboardingData.hourly_price) {
      addToast("Domain and Hourly Price are required", "error");
      return;
    }

    setSubmitting(true);
    try {
      console.log("Creating profile with data:", onboardingData);
      // 1. Create Profile
      await consultantsApi.register(onboardingData);
      console.log("Profile created successfully");

      // 2. Upload Image if selected
      if (selectedFile) {
        console.log("Uploading selected file:", selectedFile.name);
        try {
          await consultantsApi.uploadProfilePic(selectedFile);
          console.log("Image uploaded successfully");
        } catch (uploadErr) {
          console.error(
            "Failed to upload image during registration",
            uploadErr
          );
          addToast("Profile created, but image upload failed", "warning");
        }
      }

      // 3. Upload KYC document if selected
      if (kycFile) {
        try {
          await consultantsApi.uploadKycDoc(kycFile);
          console.log("KYC document uploaded successfully");
        } catch (kycErr) {
          console.error("Failed to upload KYC document", kycErr);
          addToast("Profile created, but KYC upload failed", "warning");
        }
      }

      addToast("Profile created successfully!", "success");
      fetchProfile();
    } catch (err: any) {
      console.error("Registration error:", err);
      addToast(
        err.response?.data?.error || "Failed to create profile",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("Selected file:", file);
      setUploadingImage(true);
      try {
        console.log("Starting upload for file:", file.name);
        const result = await consultantsApi.uploadProfilePic(file);
        console.log("Upload result:", result);
        addToast("Profile picture updated!", "success");
        fetchProfile(); // Refresh to get new URL
      } catch (err: any) {
        console.error("Upload error:", err);
        addToast("Failed to update profile picture", "error");
      } finally {
        setUploadingImage(false);
      }
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

  // Onboarding View
  if (!profile) {
    return (
      <Layout title="Expert Registration">
        <div className="max-w-2xl mx-auto py-12">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl">
            <div className="text-center mb-8">
              <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                <Users size={32} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Complete Your Expert Profile
              </h2>
              <p className="text-gray-500 mt-2">
                Start earning by sharing your expertise with the world.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              {/* Image Upload for Onboarding */}
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="relative w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden group">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <UserIcon size={48} />
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="text-white" size={24} />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Tap to upload photo
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Area of Expertise (Domain)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Legal, Medical, Tech, Career Coaching"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={onboardingData.domain}
                  onChange={(e) =>
                    setOnboardingData({
                      ...onboardingData,
                      domain: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Hourly Rate ($)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    placeholder="100"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={onboardingData.hourly_price}
                    onChange={(e) =>
                      setOnboardingData({
                        ...onboardingData,
                        hourly_price: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Bio / Introduction
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell clients about your experience..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  value={onboardingData.bio}
                  onChange={(e) =>
                    setOnboardingData({
                      ...onboardingData,
                      bio: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Languages Spoken
                </label>
                <input
                  type="text"
                  placeholder="e.g. English, Spanish"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={onboardingData.languages}
                  onChange={(e) =>
                    setOnboardingData({
                      ...onboardingData,
                      languages: e.target.value,
                    })
                  }
                />
              </div>

              {/* KYC Document Upload */}
              <div className="border-t pt-6">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  KYC Document <span className="text-gray-400 font-normal">(Optional – Identity proof)</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">Upload your identity proof, address proof, or any verification document. Accepted: PDF, JPG, PNG</p>
                <label className="flex items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-blue-400 transition-colors">
                  <Upload size={20} className="text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {kycFileName ? kycFileName : 'Click to upload KYC document'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setKycFile(e.target.files[0]);
                        setKycFileName(e.target.files[0].name);
                      }
                    }}
                  />
                </label>
                {kycFileName && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <span>✓</span> {kycFileName} ready to upload
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center disabled:opacity-50"
              >
                {submitting ? (
                  <Loader className="animate-spin mr-2" />
                ) : (
                  <Save className="mr-2" size={20} />
                )}
                Create Profile
              </button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Expert Portal">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Status Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Profile Image with Edit Overlay */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border-2 border-white/20 shadow-xl">
                  {profile.profile_pic || user?.avatar ? (
                    <img
                      src={profile.profile_pic || user?.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/50">
                      <UserIcon size={40} />
                    </div>
                  )}
                </div>

                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
                  {uploadingImage ? (
                    <Loader className="text-white animate-spin" />
                  ) : (
                    <Camera className="text-white" />
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpdate}
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  {profile.is_verified && (
                    <CheckCircle size={20} className="text-blue-200" />
                  )}
                  <span className="text-blue-100 font-bold text-sm tracking-wider uppercase">
                    {profile.is_verified
                      ? "Verified Profile"
                      : "Pending Verification"}
                  </span>
                </div>
                <h2 className="text-3xl font-bold mb-2">
                  {getGreeting()},{" "}
                  {profile.name ||
                    user?.name ||
                    user?.email?.split("@")[0] ||
                    "Expert"}
                  !
                </h2>
                <p className="text-blue-100/80 max-w-md">
                  Your currently set rate is <b>₹{profile.hourly_price}/hr</b>{" "}
                  in {profile.domain}.
                </p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Analytics Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsLoading
            ? // Loading skeleton for stats
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
              >
                <div className="animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gray-200 p-3 rounded-2xl w-12 h-12"></div>
                    <div className="bg-gray-200 px-3 py-1 rounded-full w-16 h-6"></div>
                  </div>
                  <div className="bg-gray-200 h-8 w-20 rounded mb-2"></div>
                  <div className="bg-gray-200 h-4 w-24 rounded"></div>
                </div>
              </div>
            ))
            : [
              {
                label: "Today's Earnings",
                value: `₹${revenueData[revenueData.length - 1]?.revenue || 0
                  }`,
                change: "+12%",
                icon: <span className="text-2xl text-emerald-600">₹</span>,
                color: "bg-emerald-50",
              },
              {
                label: "Total Sessions",
                value: dashboardStats.totalSessions,
                change: "100% success",
                icon: <Video className="text-blue-600" />,
                color: "bg-blue-50",
              },
              {
                label: "Active Clients",
                value: dashboardStats.activeClients,
                change: "+8%",
                icon: <Users className="text-amber-600" />,
                color: "bg-amber-50",
              },
              {
                label: "Avg. Rating",
                value:
                  profile.rating > 0
                    ? profile.rating.toFixed(1)
                    : dashboardStats.averageRating,
                change:
                  profile.total_reviews > 0
                    ? `${profile.total_reviews} reviews`
                    : "No reviews",
                icon: <Clock className="text-purple-600" />,
                color: "bg-purple-50",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.color} p-3 rounded-2xl`}>
                    {stat.icon}
                  </div>
                  <div className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <ArrowUpRight size={14} className="mr-0.5" />{" "}
                    {stat.change}
                  </div>
                </div>
                <p className="text-2xl font-black text-gray-900">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Revenue Overview
                </h3>
                <p className="text-sm text-gray-500">
                  {timePeriod === "7days" ? "Weekly" : "Monthly"} breakdown of
                  earnings
                </p>
              </div>
              <select
                className="bg-gray-50 border-none rounded-xl text-sm font-bold px-4 py-2 outline-none"
                value={timePeriod}
                onChange={(e) =>
                  setTimePeriod(e.target.value as "7days" | "30days")
                }
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    dy={10}
                  />
                  <Tooltip
                    cursor={{ fill: "#F3F4F6" }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={32}>
                    {revenueData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.revenue > 600 ? "#2563EB" : "#DBEAFE"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column - Slots and Sessions */}
          <div className="space-y-8">
            {/* Availability Calendar (Simplified) */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Slots Today</h3>
                <button className="p-2 hover:bg-gray-50 rounded-xl transition-all">
                  <TrendingUp size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="space-y-3">
                {todaySlots.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No slots added yet</p>
                  </div>
                ) : (
                  todaySlots.slice(0, 3).map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {slot.time}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${slot.status === "available"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                          }`}
                      >
                        {slot.status === "available" ? "Available" : "Booked"}
                      </span>
                    </div>
                  ))
                )}

                <button
                  onClick={() => navigate("/consultant/slots")}
                  className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm font-bold hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center"
                >
                  <Clock size={16} className="mr-2" />
                  Add More Slots
                </button>
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Upcoming Sessions
                </h3>
                <button className="p-2 hover:bg-gray-50 rounded-xl transition-all">
                  <Video size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="space-y-3">
                {sessionsLoading ? (
                  // Loading skeleton for sessions
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                        <div className="bg-gray-200 w-10 h-10 rounded-full"></div>
                        <div className="flex-1">
                          <div className="bg-gray-200 h-4 w-24 rounded mb-1"></div>
                          <div className="bg-gray-200 h-3 w-16 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : upcomingSessions.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Video size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No upcoming sessions</p>
                  </div>
                ) : (
                  upcomingSessions.slice(0, 3).map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
                    >
                      <div className="bg-blue-100 p-2 rounded-xl">
                        <Video className="text-blue-600" size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(session.date).toLocaleDateString()} at{" "}
                          {session.time_slot}
                        </p>
                        <p className="text-xs text-gray-500">
                          Session with Client
                        </p>
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full font-medium ${session.status === "UPCOMING"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                          }`}
                      >
                        {session.status}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ConsultantDashboard;
