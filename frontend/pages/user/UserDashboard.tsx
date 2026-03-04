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
  Video,
  Calendar,
  Wallet,
  Star,
  Loader,
  MessageCircle,
  Bell,
  Activity,
  TrendingUp,
  Users,
  Clock,
  ArrowRight,
  CheckCircle,
  Award,
  Target,
  Zap,
  Shield,
  Sparkles,
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

<div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-10 rounded-3xl shadow-xl flex justify-between items-center overflow-hidden">

  {/* Background Glow Effects */}
  <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
  <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full blur-2xl"></div>

  {/* Content */}
  <div className="relative z-10">

    <h1 className="text-4xl font-bold flex items-center gap-3">

      {/* Animated Wave */}
      <span className="animate-bounce text-3xl">
        👋
      </span>

      {greeting}, {user?.name || user?.email?.split("@")[0]}!
    </h1>

    <p className="text-blue-100 mt-3 flex items-center gap-2 text-lg">
      <Calendar className="w-5 h-5" />
      You have {upcomingSessions.length} upcoming session{upcomingSessions.length !== 1 ? "s" : ""}
    </p>

  </div>

  {/* Button */}
  <button
    onClick={() => navigate("/user/search")}
    className="relative z-10 bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
  >
    Book Session
  </button>

</div>

        

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
          <CheckCircle className="w-4 h-4 text-green-300"/>
          Max Consultants Chat Access: <b>10</b>
        </div>

        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-300"/>
          Chat Messages / Month: <b>20</b>
        </div>

        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-300"/>
          Bookings per Month: <b>Unlimited</b>
        </div>

        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-300"/>
          Booking Duration: <b>Up to 60 mins</b>
        </div>

        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-300"/>
          Booking Discount: <b>10%</b>
        </div>

        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-300"/>
          Wallet Bonus: <b>2% (max ₹200)</b>
        </div>

        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-300"/>
          Loyalty Points: <b>1%</b>
        </div>

        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-300"/>
          Free Reschedule: <b>1 / month</b>
        </div>

        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-300"/>
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
        {/* ================= QUICK ACTIONS ================= */}
           {/* ================= QUICK ACTIONS ================= */}

<div>
  <div className="flex items-center gap-2 mb-6">
    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
      <Activity className="w-4 h-4 text-white" />
    </div>

    <h2 className="text-2xl font-bold text-gray-800">
      Quick Actions
    </h2>
  </div>

  <div className="grid md:grid-cols-4 gap-6">

    {/* Find Consultant */}

    <button
      onClick={() => navigate("/user/search")}
      className="group bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-3xl border border-blue-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center text-center"
    >
      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-md group-hover:shadow-lg">
        <Video className="w-8 h-8 text-white" />
      </div>

      <p className="font-bold text-gray-800 text-lg">
        Find Consultant
      </p>

      <p className="text-sm text-gray-500 mt-1">
        Browse experts
      </p>
    </button>


    {/* Continue Chat */}

    <button
      onClick={() => navigate("/user/messages")}
      className="group bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-3xl border border-green-100 hover:border-green-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center text-center"
    >
      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-md">
        <MessageCircle className="w-8 h-8 text-white" />
      </div>

      <p className="font-bold text-gray-800 text-lg">
        Continue Chat
      </p>

      <p className="text-sm text-gray-500 mt-1">
        Active conversations
      </p>
    </button>


    {/* Buy Credits */}

    <button
      onClick={() => navigate("/user/subscription-plans")}
      className="group bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-3xl border border-purple-100 hover:border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center text-center"
    >
      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-md">
        <Wallet className="w-8 h-8 text-white" />
      </div>

      <p className="font-bold text-gray-800 text-lg">
        Buy Credits
      </p>

      <p className="text-sm text-gray-500 mt-1">
        Add balance
      </p>
    </button>


    {/* View Bookings */}

    <button
      onClick={() => navigate("/user/bookings")}
      className="group bg-gradient-to-br from-yellow-50 to-orange-50 p-8 rounded-3xl border border-yellow-100 hover:border-yellow-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center text-center"
    >
      <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-md">
        <Calendar className="w-8 h-8 text-white" />
      </div>

      <p className="font-bold text-gray-800 text-lg">
        View Bookings
      </p>

      <p className="text-sm text-gray-500 mt-1">
        Your sessions
      </p>
    </button>

  </div>
</div>

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

        {/* ================= CREDITS & SUBSCRIPTION ================= */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm opacity-90 font-medium">Current Credit Balance</p>
              </div>
              <h2 className="text-4xl font-bold mb-2">₹{walletBalance.toFixed(2)}</h2>
              {usage?.bonus_balance > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <p className="text-sm font-semibold text-yellow-300">
                    + ₹{usage.bonus_balance.toFixed(2)} Bonus Credits
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-white/70" />
                <p className="text-sm opacity-80">
                  Active Plan: <span className="font-semibold">{usage?.plan || "Basic"}</span>
                </p>
              </div>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6 relative z-10">
            <button 
              onClick={() => navigate("/user/subscription-plans")} 
              className="bg-white text-purple-600 px-6 py-2 rounded-xl font-bold hover:scale-105 transition shadow-lg"
            >
              Buy Credits
            </button>
            <button 
              onClick={() => navigate("/user/subscription-plans")} 
              className="border border-white px-6 py-2 rounded-xl hover:bg-white hover:text-purple-600 transition font-medium"
            >
              Upgrade Plan
            </button>
            <button 
              onClick={() => navigate("/user/wallet")} 
              className="border border-white px-6 py-2 rounded-xl hover:bg-white hover:text-purple-600 transition font-medium"
            >
              View Transactions
            </button>
          </div>
        </div>

        {/* ================= USAGE LIMITS ================= */}
        {usage && (
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Subscription Usage</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Monthly Chat Messages</h3>
                </div>
                <div className="flex justify-between text-sm mb-3 font-medium">
                  <span className="text-gray-600">{usage.chat_messages_used} Used</span>
                  <span className="text-blue-600 font-bold">{usage.chat_limit} Total</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.min(100, (usage.chat_messages_used / usage.chat_limit) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Bookings Made</h3>
                </div>
                <div className="text-3xl font-bold text-purple-700 mb-2">
                  {usage.bookings_made || 0}
                </div>
                <p className="text-sm text-purple-800">Total sessions booked</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Days Remaining</h3>
                </div>
                <div className="text-3xl font-bold text-green-700 mb-2">
                  {usage.days_remaining}
                </div>
                <p className="text-sm text-green-800">days left on {usage.plan} plan</p>
              </div>
            </div>
          </div>
        )}

        {/* ================= RECENT ACTIVITY ================= */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Recent Activity</h2>
          </div>

          <div className="space-y-4">
            {/* Last Booking */}
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-600 font-medium">Last Booking</span>
              </div>
              <span className="font-semibold text-gray-800 bg-white px-3 py-1 rounded-lg shadow-sm">
                {sessions?.length > 0
                  ? sessions[0]?.consultant?.domain || "Session"
                  : "No bookings"}
              </span>
            </div>

            {/* Last Payment */}
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-600 font-medium">Last Payment</span>
              </div>
              <span className="font-semibold text-gray-800 bg-white px-3 py-1 rounded-lg shadow-sm">
                {transactions?.length > 0
                  ? `₹${transactions[0]?.amount}`
                  : "No payments"}
              </span>
            </div>

            {/* Last Review */}
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="text-gray-600 font-medium">Last Review</span>
              </div>
              <span className="font-semibold text-gray-800 bg-white px-3 py-1 rounded-lg shadow-sm">
                {sessions?.some(s => s.review)
                  ? `${sessions.find(s => s.review)?.review?.rating}★`
                  : "No reviews"}
              </span>
            </div>

            {/* Recent Chat */}
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-gray-600 font-medium">Recent Chat</span>
              </div>
              <span className="font-semibold text-gray-800 bg-white px-3 py-1 rounded-lg shadow-sm">
                {sessions?.some(s => s.chat_started)
                  ? sessions.find(s => s.chat_started)?.consultant?.domain
                  : "No chats"}
              </span>
            </div>
          </div>
        </div>

        {/* ================= NOTIFICATIONS PREVIEW ================= */}
       

      </div >
    </Layout >
  );
};

export default UserDashboard;