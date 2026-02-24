import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import { useAuth } from "../../App";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  Users,
  Activity,
  Loader,
} from "lucide-react";

const EnterpriseDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [wallet, setWallet] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      await Promise.all([
        fetchSessions(),
        fetchTeam(),
        fetchWallet(),
        fetchNotifications(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= SAFE FETCH ================= */

  const fetchSessions = async () => {
    try {
      const res = await api.get("/enterprise/bookings");

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.bookings || res.data?.data || [];

      setSessions(data);
    } catch (err) {
      console.error("Sessions fetch failed");
      setSessions([]);
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await api.get("/enterprise/team");

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.team || [];

      setTeam(data);
    } catch {
      setTeam([]);
    }
  };

  const fetchWallet = async () => {
    try {
      const res = await api.get("/enterprise/wallet");
      setWallet(res.data?.balance || 0);
    } catch {
      setWallet(0);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.notifications || [];

      setNotifications(data.slice(0, 3));
    } catch {
      setNotifications([]);
    }
  };

  /* ================= SAFE CALCULATIONS ================= */

  const safeSessions = Array.isArray(sessions) ? sessions : [];

  const liveSession = safeSessions.find(
    (s) => s?.status === "LIVE"
  );

  const upcomingSessions = safeSessions
    .filter((s) => s?.status === "CONFIRMED")
    .slice(0, 3);

  const completedSessions = safeSessions.filter(
    (s) => s?.status === "COMPLETED"
  );

  const totalRevenue = useMemo(() => {
    return completedSessions.reduce(
      (sum, s) => sum + (Number(s?.price) || 0),
      0
    );
  }, [completedSessions]);

  const completionRate = useMemo(() => {
    if (!safeSessions.length) return 0;
    return Math.round(
      (completedSessions.length / safeSessions.length) * 100
    );
  }, [safeSessions, completedSessions]);

  const totalSessions = safeSessions.length;

  const profileCompletion = useMemo(() => {
    if (!user) return 0;

    const fields = [
      user?.name,
      user?.email,
      user?.phone,
      user?.profile_pic,
      user?.enterpriseId,
    ];

    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [user]);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <Layout title="Enterprise Dashboard">
        <div className="flex justify-center items-center h-screen">
          <Loader className="animate-spin text-blue-600" size={40} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Enterprise Dashboard">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* ================= LIVE SESSION ================= */}
        {liveSession && (
          <div className="bg-red-600 text-white p-8 rounded-3xl flex justify-between items-center shadow-lg">
            <div>
              <p className="text-xs bg-white/20 px-3 py-1 rounded-full inline-block mb-2">
                LIVE SESSION
              </p>
              <h2 className="text-2xl font-bold">
                Client: {liveSession?.client?.name || "Client"}
              </h2>
              <p>{liveSession?.domain || ""}</p>
            </div>
            <button className="bg-white text-red-600 px-6 py-2 rounded-xl font-semibold">
              Join Now →
            </button>
          </div>
        )}

        {/* ================= WELCOME ================= */}
        <div className="bg-white p-8 rounded-3xl border shadow-sm flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome, {user?.email?.split("@")[0] || "Admin"} 👋
            </h1>

            <div className="flex items-center gap-3 mt-3">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                {user?.verification_status || "Pending"}
              </span>

              <span className="text-sm text-gray-500">
                Profile Completion: {profileCompletion}%
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate("/enterprise/bookings")}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl"
          >
            View Bookings
          </button>
        </div>

        {/* ================= SUMMARY CARDS ================= */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border shadow-sm">
            <Wallet className="text-blue-600 mb-3" />
            <p className="text-2xl font-bold">
              ₹{totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">
              Company Earnings
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border shadow-sm">
            <Users className="text-green-600 mb-3" />
            <p className="text-2xl font-bold">
              {team.length}
            </p>
            <p className="text-xs text-gray-500">
              Active Consultants
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border shadow-sm">
            <Activity className="text-purple-600 mb-3" />
            <p className="text-2xl font-bold">
              {completionRate}%
            </p>
            <p className="text-xs text-gray-500">
              Session Success Rate
            </p>
          </div>
        </div>

        {/* ================= UPCOMING ================= */}
        <div className="bg-white p-8 rounded-3xl border shadow-sm">
          <h2 className="text-2xl font-bold mb-6">
            Upcoming Sessions
          </h2>

          {upcomingSessions.length === 0 ? (
            <p className="text-gray-500">
              No upcoming sessions.
            </p>
          ) : (
            upcomingSessions.map((s, i) => (
              <div key={i} className="border-b py-4 flex justify-between">
                <div>
                  <p className="font-semibold">
                    {s?.client?.name || "Client"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {s?.startTime
                      ? new Date(s.startTime).toLocaleString()
                      : ""}
                  </p>
                </div>

                <button className="text-blue-600">
                  View Details
                </button>
              </div>
            ))
          )}
        </div>

        {/* ================= NOTIFICATIONS ================= */}
        <div className="bg-white p-8 rounded-3xl border shadow-sm">
          <div className="flex justify-between mb-6">
            <h2 className="text-2xl font-bold">Notifications</h2>
            <button
              onClick={() => navigate("/enterprise/messages")}
              className="text-blue-600"
            >
              View All
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="text-gray-500">No notifications</p>
          ) : (
            notifications.map((n, i) => (
              <div key={i} className="border-b py-3">
                <p className="font-semibold">{n?.title}</p>
                <p className="text-sm text-gray-500">
                  {n?.message}
                </p>
              </div>
            ))
          )}
        </div>

      </div>
    </Layout>
  );
};

export default EnterpriseDashboard;
