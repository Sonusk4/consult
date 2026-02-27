import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dashboard } from "../services/api";
import {
  TrendingUp, Users, DollarSign, CheckCircle, Clock, Building2,
  ArrowUpRight, Loader, ChevronRight
} from "lucide-react";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentConsultants, setRecentConsultants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, activityData] = await Promise.all([
        dashboard.getStats(),
        dashboard.getActivity(),
      ]);
      setStats(statsData);
      setRecentUsers(activityData?.recentUsers || []);
      setRecentConsultants(activityData?.recentConsultants || []);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (loading) return (
    <div className="page-container flex items-center justify-center min-h-screen">
      <Loader className="h-8 w-8 animate-spin mx-auto text-blue-600" />
    </div>
  );

  if (error) return (
    <div className="page-container">
      <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg p-4">
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="mt-2 text-sm font-medium underline">Try Again</button>
      </div>
    </div>
  );

  const statCards = [
    {
      label: "Total Users",
      value: stats?.totalUsers || 0,
      icon: <Users className="h-5 w-5" />,
      color: "bg-blue-100 text-blue-700",
      link: "/admin/users",
    },
    {
      label: "Total Consultants",
      value: stats?.totalConsultants || 0,
      icon: <CheckCircle className="h-5 w-5" />,
      color: "bg-green-100 text-green-700",
      link: "/admin/consultants-list",
    },
    {
      label: "Pending KYC",
      value: stats?.pendingKyc || 0,
      icon: <Clock className="h-5 w-5" />,
      color: "bg-yellow-100 text-yellow-700",
      link: null,
    },
    {
      label: "Total Revenue",
      value: `₹${((stats?.totalRevenue || 0) / 1000).toFixed(0)}K`,
      icon: <DollarSign className="h-5 w-5" />,
      color: "bg-blue-100 text-blue-700",
      link: "/admin/transactions",
    },
    {
      label: "Total Bookings",
      value: stats?.totalBookings || 0,
      icon: <TrendingUp className="h-5 w-5" />,
      color: "bg-green-100 text-green-700",
      link: "/admin/transactions",
    },
    {
      label: "Enterprises",
      value: stats?.totalEnterprises || 0,
      icon: <Building2 className="h-5 w-5" />,
      color: "bg-yellow-100 text-yellow-700",
      link: "/admin/enterprise",
    },
  ];

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back. Here's your platform overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            onClick={() => stat.link && navigate(stat.link)}
            className={`stat-card transition-all duration-200 ${stat.link ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-blue-300" : ""}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
              {stat.link && (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-sm text-gray-600">{stat.label}</p>
              {stat.link && (
                <span className="text-xs text-blue-600 font-medium">View all →</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
            <button onClick={() => navigate("/admin/users")} className="text-xs text-blue-600 hover:underline font-medium">View all</button>
          </div>
          {recentUsers.length > 0 ? (
            <div className="divide-y">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="px-6 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/admin/users/${user.id}`)}
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-sm flex-shrink-0">
                    {(user.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name || user.email}</p>
                    <p className="text-xs text-gray-500">{user.role} · {formatDate(user.created_at)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500"><p>No users yet</p></div>
          )}
        </div>

        <div className="bg-white rounded-xl border">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Consultants</h2>
            <button onClick={() => navigate("/admin/consultants-list")} className="text-xs text-blue-600 hover:underline font-medium">View all</button>
          </div>
          {recentConsultants.length > 0 ? (
            <div className="divide-y">
              {recentConsultants.map((c) => (
                <div
                  key={c.id}
                  className="px-6 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/admin/consultants-list/${c.id}`)}
                >
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium text-sm flex-shrink-0">
                    {(c.user?.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.user?.name || c.user?.email}</p>
                    <p className="text-xs text-gray-500">{c.domain || "No domain"} · {formatDate(c.user?.created_at)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500"><p>No consultants yet</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
