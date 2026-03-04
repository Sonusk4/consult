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
    // fetchConsultants();
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
      setConsultants(data?.slice(0, 3) || []);
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
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl">👋</span>
              </div>
              <h1 className="text-4xl font-bold">
                {greeting}, {user?.name || user?.email?.split("@")[0]}!
              </h1>
            </div>
            <p className="text-blue-100 text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              You have {upcomingSessions.length} upcoming session{upcomingSessions.length !== 1 ? 's' : ''}
            </p>
          </div>

          <button
            onClick={() => navigate("/user/search")}
            className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 relative z-10"
          >
            Book Session
          </button>
        </div>

        {/* ================= PROFILE COMPLETION ================= */}
        <div
          onClick={() => navigate("/user/profile")}
          className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-green-100 hover:border-green-200 transform hover:scale-[1.01]"
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-gray-800">Profile Completion</h3>
            </div>
            <span className="text-green-600 font-bold text-sm bg-green-100 px-3 py-1 rounded-full">
              Edit →
            </span>
          </div>

          <div className="w-full bg-green-200 rounded-full h-4 mb-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>

          <p className="text-sm text-gray-600 font-medium">
            {profileCompletion}% completed
            {profileCompletion < 100 && (
              <span className="text-orange-500 ml-2">
                • {100 - profileCompletion}% to go!
              </span>
            )}
          </p>
        </div>

        {/* ================= QUICK ACTIONS ================= */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Quick Actions</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <button
              onClick={() => navigate("/user/search")}
              className="group bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:from-blue-100 hover:to-indigo-100"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:shadow-lg transition-all">
                <Video className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-gray-800">Find Consultant</p>
              <p className="text-xs text-gray-500 mt-1">Browse experts</p>
            </button>

            <button
              onClick={() => navigate("/user/messages")}
              className="group bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-3xl border border-green-100 hover:border-green-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:from-green-100 hover:to-emerald-100"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-3 group-hover:shadow-lg transition-all">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-gray-800">Continue Chat</p>
              <p className="text-xs text-gray-500 mt-1">Active conversations</p>
            </button>

            <button
              onClick={() => navigate("/user/subscription-plans")}
              className="group bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-3xl border border-purple-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:from-purple-100 hover:to-pink-100"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:shadow-lg transition-all">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-gray-800">Buy Credits</p>
              <p className="text-xs text-gray-500 mt-1">Add balance</p>
            </button>

            <button
              onClick={() => navigate("/user/bookings")}
              className="group bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-3xl border border-yellow-100 hover:border-yellow-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:from-yellow-100 hover:to-orange-100"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-3 group-hover:shadow-lg transition-all">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-gray-800">View Bookings</p>
              <p className="text-xs text-gray-500 mt-1">Your sessions</p>
            </button>
          </div>
        </div>

        {/* ================= RECOMMENDED CONSULTANTS ================= */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            Recommended Consultants
          </h2>

          {consultants?.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl shadow-sm border text-gray-500">
              No recommendations available.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

              {consultants.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-6 rounded-3xl shadow-sm border hover:shadow-md transition"
                >
                  {/* Profile Image */}
                  <div className="flex justify-center mb-4">
                    <img
                      src={c.profile_pic || "https://via.placeholder.com/100"}
                      alt={c.name}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  </div>

                  {/* Name */}
                  <h3 className="text-lg font-bold text-center">
                    {c.name}
                  </h3>

                  {/* Domain */}
                  <p className="text-blue-600 text-sm text-center mt-1">
                    {c.domain}
                  </p>

                  {/* Rating */}
                  <div className="flex justify-center items-center mt-3 text-yellow-500 text-sm">
                    ⭐ {c.rating || 5}
                  </div>


                  {/* Price */}
                  <p className="text-center font-semibold mt-3">
                    ₹{c.hourly_price} / session
                  </p>

                  {/* View Profile Button */}
                  <div className="flex justify-center mt-5">
                    <button
                      onClick={() => navigate(`/user/consultant/${c.id}`)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition"
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
        <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white p-8 rounded-3xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm opacity-80 mb-2">Current Credit Balance</p>
              <h2 className="text-4xl font-bold mb-1">₹{walletBalance.toFixed(2)}</h2>
              {usage?.bonus_balance > 0 && (
                <p className="text-sm font-semibold text-blue-200 mb-4">
                  + ₹{usage.bonus_balance.toFixed(2)} Bonus
                </p>
              )}
              <p className="text-sm opacity-80 mt-4">
                Active Plan: <span className="font-semibold">{usage?.plan || "Basic"}</span>
              </p>
            </div>
            <Wallet size={36} className="text-white/70" />
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            <button onClick={() => navigate("/user/subscription-plans")} className="bg-white text-blue-900 px-6 py-2 rounded-xl font-semibold hover:scale-105 transition">Buy Credits</button>
            <button onClick={() => navigate("/user/subscription-plans")} className="border border-white px-6 py-2 rounded-xl hover:bg-white hover:text-blue-900 transition">Upgrade Plan</button>
            <button onClick={() => navigate("/user/wallet")} className="border border-white px-6 py-2 rounded-xl hover:bg-white hover:text-blue-900 transition">View Transactions</button>
          </div>
        </div>

        {/* ================= USAGE LIMITS ================= */}
        {usage && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border mt-6">
            <h2 className="text-2xl font-bold mb-6">Subscription Usage</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
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

              <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                <h3 className="font-semibold text-purple-900 mb-2">Bookings Made</h3>
                <div className="text-3xl font-bold text-purple-700">
                  {usage.bookings_made || 0}
                </div>
                <p className="text-sm text-purple-800 mt-1">Total sessions booked</p>
              </div>

              <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                <h3 className="font-semibold text-green-900 mb-2">Days Remaining</h3>
                <div className="text-3xl font-bold text-green-700">
                  {usage.days_remaining}
                </div>
                <p className="text-sm text-green-800 mt-1">days left on {usage.plan} plan</p>
              </div>
            </div>
          </div>
        )
        }

        {/* ================= RECENT ACTIVITY ================= */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border">

          <h2 className="text-2xl font-bold mb-6">
            Recent Activity
          </h2>

          <div className="space-y-4">

            {/* Last Booking */}
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-gray-500">Last Booking</span>
              <span className="font-semibold text-gray-900">
                {sessions?.length > 0
                  ? sessions[0]?.consultant?.domain || "Session"
                  : "No bookings"}
              </span>
            </div>

            {/* Last Payment */}
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-gray-500">Last Payment</span>
              <span className="font-semibold text-gray-900">
                {transactions?.length > 0
                  ? `₹${transactions[0]?.amount}`
                  : "No payments"}
                  
              </span>
            </div>

            {/* Last Review */}
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-gray-500">Last Review</span>
              <span className="font-semibold text-gray-900">
                {sessions?.some(s => s.review)
                  ? `${sessions.find(s => s.review)?.review?.rating}★`
                  : "No reviews"}
              </span>
            </div>

            {/* Recent Chat */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Recent Chat</span>
              <span className="font-semibold text-gray-900">
                {sessions?.some(s => s.chat_started)
                  ? sessions.find(s => s.chat_started)?.consultant?.domain
                  : "No chats"}
              </span>
            </div>

          </div>

        </div>



        {/* ================= NOTIFICATIONS PREVIEW ================= */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border">

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Notifications</h2>

            <button
              onClick={() => navigate("/user/message")}
              className="text-blue-600 font-semibold hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-4">

            {Array.isArray(notifications) && notifications.length > 0 ? (
              notifications.slice(0, 3).map((n, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{n.title}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {n.message}
                      </p>
                    </div>

                    <span className="text-xs text-gray-400">
                      {n.created_at
                        ? new Date(n.created_at).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No notifications available</p>
            )}

          </div>
        </div>



      </div >
    </Layout >
  );
};

export default UserDashboard;