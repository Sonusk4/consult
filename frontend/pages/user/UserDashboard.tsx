import React, { useEffect, useState, useMemo } from "react";
import Layout from "../../components/Layout";
import {
  bookings as bookingsApi,
  consultants as consultantsApi,
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


  useEffect(() => {
    fetchBookings();
    fetchWallet();
    fetchConsultants();
    fetchNotifications();
    fetchTransactions();

  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);


  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");

      // Ensure it's always an array
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.notifications || res.data?.data || [];

      setNotifications(data.slice(0, 3));

    } catch (err) {
      console.error("Failed to fetch notifications");
      setNotifications([]); // fallback
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

    const fields = [
      user.name,
      user.email,
      user.phone,
      user.profile_pic,
    ];

    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
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
          <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-8 rounded-3xl flex justify-between items-center shadow-lg">
            <div>
              <p className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full mb-2 inline-block">
                LIVE
              </p>
              <h2 className="text-2xl font-bold">
                {liveSession.consultant?.user?.email}
              </h2>
              <p className="text-sm opacity-90">
                {liveSession.consultant?.domain}
              </p>
            </div>
            <button className="bg-white text-red-600 px-6 py-2 rounded-xl font-semibold">
              Join Now →
            </button>
          </div>
        )}

        {/* ================= WELCOME ================= */}
        {/* ================= WELCOME ================= */}
        <div className="bg-white p-10 rounded-3xl shadow-sm border flex justify-between items-center">

          <div>
            <h1 className="text-4xl font-bold mb-4">
              {greeting}, {user?.name || user?.email?.split("@")[0]} 👋
            </h1>

            <p className="text-gray-500">
              You have {upcomingSessions.length} upcoming session(s).
            </p>
          </div>

          <button
            onClick={() => navigate("/user/search")}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-md"
          >
            Book Session
          </button>

        </div>


        {/* ================= PROFILE COMPLETION ================= */}
        <div
          onClick={() => navigate("/user/profile")}
          className="bg-white p-6 rounded-3xl shadow-sm border cursor-pointer hover:shadow-md transition"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold">Profile Completion</h3>
            <span className="text-blue-600 font-semibold text-sm">
              Edit →
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>

          <p className="text-sm text-gray-500">
            {profileCompletion}% completed
          </p>
        </div>

        {/* ================= QUICK ACTIONS ================= */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            Quick Actions
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            <button
              onClick={() => navigate("/user/search")}
              className="bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md"
            >
              <Video className="mb-3 text-blue-600" />
              Find Consultant
            </button>

            <button
              onClick={() => navigate("/user/message")}
              className="bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md"
            >
              <MessageCircle className="mb-3 text-green-600" />
              Continue Chat
            </button>

            <button
              onClick={() => navigate("/user/wallet")}
              className="bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md"
            >
              <Wallet className="mb-3 text-purple-600" />
              Buy Credits
            </button>

            <button
              onClick={() => navigate("/user/bookings")}
              className="bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md"
            >
              <Calendar className="mb-3 text-yellow-500" />
              View Bookings
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

                  <button
                    onClick={() => navigate("/user/credits")}
                    className="border border-white px-6 py-2 rounded-xl hover:bg-white hover:text-blue-900 transition"
                  >
                    Upgrade Plan
                  </button>

                  <button
                    onClick={() => navigate("/user/credits")}
                    className="border border-white px-6 py-2 rounded-xl hover:bg-white hover:text-blue-900 transition"
                  >
                    View Transactions
                  </button>


                </div>
              ))}

            </div>
          )}
        </div>


        {/* ================= CREDITS & SUBSCRIPTION ================= */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white p-8 rounded-3xl shadow-lg">

          <div className="flex justify-between items-start">

            <div>
              <p className="text-sm opacity-80 mb-2">
                Current Credit Balance
              </p>

              <h2 className="text-4xl font-bold mb-4">
                ₹{walletBalance.toFixed(2)}
              </h2>

              <p className="text-sm opacity-80">
                Active Plan: <span className="font-semibold">Basic</span>
              </p>

              <p className="text-sm opacity-80">
                Plan Expiry: 31 Dec 2025
              </p>
            </div>

            <Wallet size={36} className="text-white/70" />

          </div>

          <div className="flex flex-wrap gap-4 mt-6">

            <button
              onClick={() => navigate("/user/wallet")}
              className="bg-white text-blue-900 px-6 py-2 rounded-xl font-semibold hover:scale-105 transition"
            >
              Buy Credits
            </button>

            <button
              onClick={() => navigate("/user/wallet")}
              className="border border-white px-6 py-2 rounded-xl hover:bg-white hover:text-blue-900 transition"
            >
              Upgrade Plan
            </button>

            <button
              onClick={() => navigate("/user/wallet")}
              className="border border-white px-6 py-2 rounded-xl hover:bg-white hover:text-blue-900 transition"
            >
              View Transactions
            </button>

          </div>

        </div>

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



      </div>
    </Layout>
  );
};

export default UserDashboard;
