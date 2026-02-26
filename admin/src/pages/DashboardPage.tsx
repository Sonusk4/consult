import React, { useEffect, useState } from "react";
import { TrendingUp, Users, DollarSign, CheckCircle, ArrowUpRight, Loader, Clock, Building2 } from "lucide-react";
import { dashboard } from "../services/api";

interface StatItem {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant: "info" | "success" | "warning";
}

const variantColors = {
  info: "bg-blue-100 text-blue-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
};

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentConsultants, setRecentConsultants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, activityData] = await Promise.all([
        dashboard.getStats(),
        dashboard.getActivity(),
      ]);

      const formattedStats: StatItem[] = [
        {
          label: "Total Users",
          value: statsData.totalUsers || 0,
          icon: <Users className="h-5 w-5" />,
          variant: "info",
        },
        {
          label: "Total Consultants",
          value: statsData.totalConsultants || 0,
          icon: <CheckCircle className="h-5 w-5" />,
          variant: "success",
        },
        {
          label: "Pending KYC",
          value: statsData.pendingKyc || 0,
          icon: <Clock className="h-5 w-5" />,
          variant: "warning",
        },
        {
          label: "Total Revenue",
          value: `₹${((statsData.totalRevenue || 0) / 1000).toFixed(0)}K`,
          icon: <DollarSign className="h-5 w-5" />,
          variant: "info",
        },
        {
          label: "Total Bookings",
          value: statsData.totalBookings || 0,
          icon: <TrendingUp className="h-5 w-5" />,
          variant: "success",
        },
        {
          label: "Enterprises",
          value: statsData.totalEnterprises || 0,
          icon: <Building2 className="h-5 w-5" />,
          variant: "warning",
        },
      ];

      setStats(formattedStats);
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
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg p-4 mb-8">
          <p>{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-2 text-sm font-medium underline hover:no-underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back. Here's your platform overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${variantColors[stat.variant]}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-xl border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
          </div>
          {recentUsers.length > 0 ? (
            <div className="divide-y">
              {recentUsers.map((user) => (
                <div key={user.id} className="px-6 py-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-sm">
                    {(user.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name || user.email}</p>
                    <p className="text-xs text-gray-500">{user.role} · {formatDate(user.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>No users yet</p>
            </div>
          )}
        </div>

        {/* Recent Consultants */}
        <div className="bg-white rounded-xl border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Consultants</h2>
          </div>
          {recentConsultants.length > 0 ? (
            <div className="divide-y">
              {recentConsultants.map((c) => (
                <div key={c.id} className="px-6 py-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium text-sm">
                    {(c.user?.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.user?.name || c.user?.email}</p>
                    <p className="text-xs text-gray-500">{c.domain || "No domain"} · {formatDate(c.user?.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>No consultants yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
