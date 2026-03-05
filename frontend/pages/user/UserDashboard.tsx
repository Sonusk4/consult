import React, { useEffect, useState, useMemo } from "react";
import Layout from "../../components/Layout";
import {
  bookings as bookingsApi,
  consultants as consultantsApi,
  subscriptions
} from "../../services/api";
import api from "../../services/api";
import { Booking, Consultant } from "../../types";
import { useNavigate } from "react-router-dom";
import {
  Video, Calendar, Wallet, Star, Loader, MessageCircle, Activity, TrendingUp,
  Users, Clock, ArrowRight, CheckCircle, Award, Target, Zap, Shield, Sparkles, Search,
} from "lucide-react";
import { useAuth } from "../../App";
const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Booking[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  useEffect(() => {
    // TEMPORARILY DISABLED - These API calls are causing logout when navigating to search page
    fetchBookings();
    fetchWallet();
    fetchConsultants();
    // fetchNotifications();
    // fetchTransactions();
    fetchUsage();
    // Set loading to false since we're not fetching data
    setLoading(false);
  }, []);
  const fetchUsage = async () => {
    try {
      const data = await subscriptions.getUsageMetrics();
      setUsage(data);
    } catch { }
  };
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);
  const fetchNotifications = async () => {
    try {
      // TODO: Implement notifications endpoint
      // const res = await api.get("/notifications");
      // const data = Array.isArray(res.data) ? res.data : res.data?.notifications || res.data?.data || [];
      // setNotifications(data.slice(0, 3));
      setNotifications([]); // placeholder until endpoint is implemented
    } catch (err) {
      setNotifications([]);
    }
  };
  const fetchTransactions = async () => {
    try {
      const res = await api.get("/transactions");
      setTransactions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch transactions");
    }
  };
  const fetchBookings = async () => {
    try {
      const data = await bookingsApi.getAll();
      setSessions(data || []);
    } finally {
      setLoading(false);
    }
  };
  const fetchWallet = async () => {
    try {
      const res = await api.get("/wallet");
      setWalletBalance(res.data.balance || 0);
    } catch { }
  };
  const fetchConsultants = async () => {
    try {
      const data = await consultantsApi.getAll();
      // Filter consultants with 4+ rating and take first 3
      const filteredConsultants = data?.filter(c => (c.rating || 0) >= 4).slice(0, 3) || [];
      setConsultants(filteredConsultants);
    } catch { }
  };
  const liveSession = sessions.find((s) => s.status === "LIVE");
  const upcomingSessions = sessions
    .filter((s) => s.status === "CONFIRMED")
    .slice(0, 3);
  /* ================= PROFILE COMPLETION (DYNAMIC) ================= */
  const profileCompletion = useMemo(() => {
    if (!user) return 0;
    // Debug: Log user data to understand what's available
    console.log('User data for profile completion:', user);
    const fields = [
      user.name,
      user.email,
      user.phone,
      user.profile_pic || user.avatar || user.profile_photo,
    ];
    const filled = fields.filter(Boolean).length;
    const completion = Math.round((filled / fields.length) * 100);
    // Debug: Log completion calculation
    console.log('Profile completion calculation:', {
      fields: fields.map(f => Boolean(f)),
      filled,
      total: fields.length,
      completion
    });
    return completion;
  }, [user]);
  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex justify-center items-center h-screen">
          <Loader className="animate-spin text-blue-600" size={40} />
        </div>
      </Layout>
    );
  }
  return (
    <Layout title="Dashboard">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* ================= LIVE SESSION ================= */}
        {liveSession && (
          <div className="bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 text-white p-8 rounded-3xl flex justify-between items-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <p className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  LIVE SESSION
                </p>
              </div>
              <h2 className="text-3xl font-bold mb-2">
                {liveSession.consultant?.user?.email}
              </h2>
              <p className="text-sm opacity-90 flex items-center gap-2">
                <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                {liveSession.consultant?.domain}
              </p>
            </div>
            <button className="bg-white text-red-600 px-8 py-3 rounded-xl font-bold hover:bg-red-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
              Join Now →
            </button>
          </div>
        )}
        {/* ================= WELCOME ================= */}
        {/* ================= WELCOME ================= */}
        <div className="py-10 text-center">
          {/* Small Tag */}
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-1 rounded-full text-sm font-semibold mb-6">
            ✨ THE FUTURE OF EXPERT ADVICE
          </div>
          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl font-bold text-center leading-tight text-gray-900">
            Connect with top-tier <br />
            <span
              className="bg-[linear-gradient(90deg,#a855f7_0%,#8b5cf6_35%,#6366f1_70%,#4f46e5_100%)] bg-clip-text text-transparent"
              style={{
                textShadow:
                  "0 0 8px rgba(168,85,247,0.25), 0 0 16px rgba(139,92,246,0.25), 0 0 28px rgba(99,102,241,0.25)"
              }}
            >
              Specialists instantly.
            </span>
          </h1>
        </div>
        {/* ================= SEARCH BAR ================= */}
        <div className="max-w-3xl mx-auto mt-8">
          {/* Search Box */}
          <div className="relative bg-white rounded-full shadow-xl border border-gray-200 flex items-center p-2">
            <Search className="absolute left-6 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Ex: 'Business Strategy', 'Yoga Coach', 'Supreme Court Lawyer'"
              onClick={() => navigate("/user/search")}
              className="flex-1 pl-12 pr-32 py-4 rounded-full outline-none text-gray-700 placeholder-gray-400 bg-transparent"
            />
            <button
              onClick={() => navigate("/user/search")}
              className="absolute right-2 bg-gray-900 text-white px-8 py-3 rounded-full font-semibold hover:bg-black transition"
            >
              Search
            </button>
          </div>
          {/* Trending */}
        </div>
        {/* ================= QUICK ACTIONS ================= */}
        {/* ================= CONSULTANT CATEGORIES ================= */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">
              Consultant Categories
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {/* Legal */}
            <div
              onClick={() => navigate('/user/search?category=legal')}
              className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl border border-blue-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-white text-2xl">⚖️</span>
              </div>
              <h3 className="font-bold text-blue-900 text-lg">
                Legal
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Expert legal advice
              </p>
            </div>
            {/* Doctor */}
            <div
              onClick={() => navigate('/user/search?category=medical')}
              className="bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-2xl border border-red-200 hover:border-red-300 hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-white text-2xl">👨‍⚕️</span>
              </div>
              <h3 className="font-bold text-red-900 text-lg">
                Doctor
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Medical consultation
              </p>
            </div>
            {/* Tech */}
            <div
              onClick={() => navigate('/user/search?category=technology')}
              className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl border border-green-200 hover:border-green-300 hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-white text-2xl">💻</span>
              </div>
              <h3 className="font-bold text-green-900 text-lg">
                Tech
              </h3>
              <p className="text-sm text-green-700 mt-1">
                IT & development
              </p>
            </div>
            {/* Engineer */}
            <div
              onClick={() => navigate('/user/search?category=engineering')}
              className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl border border-orange-200 hover:border-orange-300 hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-white text-2xl">🔧</span>
              </div>
              <h3 className="font-bold text-orange-900 text-lg">
                Engineer
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                Engineering solutions
              </p>
            </div>
            {/* Finance */}
            <div
              onClick={() => navigate('/user/search?category=finance')}
              className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-8 rounded-2xl border border-yellow-200 hover:border-yellow-300 hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-white text-2xl">💰</span>
              </div>
              <h3 className="font-bold text-yellow-900 text-lg">
                Finance
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Financial planning
              </p>
            </div>
            {/* Education */}
            <div
              onClick={() => navigate('/user/search?category=education')}
              className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl border border-purple-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-white text-2xl">🎓</span>
              </div>
              <h3 className="font-bold text-purple-900 text-lg">
                Education
              </h3>
              <p className="text-sm text-purple-700 mt-1">
                Learning & training
              </p>
            </div>
            {/* Marketing */}
            <div
              onClick={() => navigate('/user/search?category=marketing')}
              className="bg-gradient-to-br from-pink-50 to-pink-100 p-8 rounded-2xl border border-pink-200 hover:border-pink-300 hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-white text-2xl">📢</span>
              </div>
              <h3 className="font-bold text-pink-900 text-lg">
                Marketing
              </h3>
              <p className="text-sm text-pink-700 mt-1">
                Marketing strategy
              </p>
            </div>
          </div>
        </div>
        {/* ================= RECOMMENDED CONSULTANTS ================= */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Recommended Consultants</h2>
          </div>
          {consultants?.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-3xl shadow-lg border border-gray-200 text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No recommendations available.</p>
              <p className="text-gray-400 text-sm mt-2">Start exploring consultants to get personalized recommendations</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {consultants.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 transform hover:scale-[1.02] group"
                >
                  {/* Profile Image */}
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <img
                        src={c.profile_pic || "https://via.placeholder.com/100"}
                        alt={c.name}
                        className="h-20 w-20 rounded-full object-cover border-4 border-gray-100 group-hover:border-blue-200 transition-all duration-300"
                      />
                      <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                  </div>
                  {/* Name */}
                  <h3 className="text-lg font-bold text-center text-gray-800 group-hover:text-blue-600 transition-colors">
                    {c.user?.name || c.name || 'Consultant'}
                  </h3>
                  {/* Domain */}
                  <p className="text-blue-600 text-sm text-center mt-1 font-medium">
                    {c.domain}
                  </p>
                  {/* Rating */}
                  <div className="flex justify-center items-center mt-3">
                    <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-sm font-semibold text-gray-700">{c.rating || 5}</span>
                    </div>
                  </div>
                  {/* Price */}
                  <div className="text-center mt-4">
                    <p className="text-2xl font-bold text-gray-800">
                      ₹{c.hourly_price}
                      <span className="text-sm text-gray-500 font-normal">/session</span>
                    </p>
                  </div>
                  {/* View Profile Button */}
                  <div className="flex justify-center mt-5">
                    <button
                      onClick={() => navigate(`/user/consultant/${c.id}`)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* ================= USAGE LIMITS ================= */}
        {/* ================= USAGE + RECENT ACTIVITY ================= */}
        {/* ================= STARTER PLAN BANNER ================= */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-10 rounded-3xl shadow-xl overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-10">
            {/* LEFT SIDE */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full flex items-center gap-2 shadow-md">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-bold tracking-wide">
                    STARTER PLAN
                  </span>
                </div>
                <span className="bg-white/20 text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                  MOST POPULAR
                </span>
              </div>
              <p className="text-indigo-100 mb-6">
                Perfect plan for users who want regular consultations and exclusive booking benefits.
              </p>
              {/* FEATURES GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  Max Consultants Chat Access: <b>10</b>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  Chat Messages / Month: <b>20</b>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  Bookings per Month: <b>Unlimited</b>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  Booking Duration: <b>Up to 60 mins</b>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  Booking Discount: <b>10%</b>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  Wallet Bonus: <b>2% (max ₹200)</b>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  Loyalty Points: <b>1%</b>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  Free Reschedule: <b>1 / month</b>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  Cancellation Policy: <b>Strict</b>
                </div>
              </div>
            </div>
            {/* RIGHT SIDE PRICE */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-center min-w-[240px]">
              <p className="text-sm text-white/80 mb-2">
                Starter Plan
              </p>
              <div className="text-5xl font-bold">
                ₹199
              </div>
              <p className="text-sm text-white/80 mb-4">
                per month
              </p>
              <button
                onClick={() => navigate("/user/subscription-plans")}
                className="bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 w-full transition"
              >
                Upgrade Now
              </button>
              <p className="text-xs text-white/70 mt-3">
                Best for regular consultations
              </p>
            </div>
          </div>
        </div>
      </div >
    </Layout >
  );
};
export default UserDashboard;