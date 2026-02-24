import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";
import { bookings as bookingsApi } from "../../services/api";
import { Booking } from "../../types";
import {
  BarChart3,
  Users,
  DollarSign,
  CheckCircle,
  Loader,
} from "lucide-react";

const EnterpriseAnalytics: React.FC = () => {
  const [sessions, setSessions] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH BOOKINGS ================= */

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await bookingsApi.getAll(); // or enterprise endpoint
      setSessions(data || []);
    } catch (error) {
      console.error("Failed to fetch analytics data", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= BASIC METRICS ================= */

  const totalSessions = sessions.length;

  const completedSessions = useMemo(() => {
    return sessions.filter((s) => s.status === "COMPLETED");
  }, [sessions]);

  const completionRate =
    totalSessions > 0
      ? ((completedSessions.length / totalSessions) * 100).toFixed(1)
      : "0";

  const totalRevenue = completedSessions.reduce(
    (sum, s) => sum + (s.price || 0),
    0
  );

  const activeConsultants = new Set(
    sessions.map((s) => s.consultant?.user?.email).filter(Boolean)
  ).size;

  /* ================= MONTHLY REVENUE ================= */

  const monthlyRevenue = useMemo(() => {
    const months = Array(12).fill(0);

    completedSessions.forEach((session) => {
      if (session.date) {
        const month = new Date(session.date).getMonth();
        months[month] += session.price || 0;
      }
    });

    return months;
  }, [completedSessions]);

  const maxRevenue = Math.max(...monthlyRevenue, 1);

  /* ================= STATUS DISTRIBUTION ================= */

  const statusCounts = useMemo(() => {
    return {
      CONFIRMED: sessions.filter((s) => s.status === "CONFIRMED").length,
      LIVE: sessions.filter((s) => s.status === "LIVE").length,
      COMPLETED: completedSessions.length,
      CANCELLED: sessions.filter((s) => s.status === "CANCELLED").length,
    };
  }, [sessions, completedSessions]);

  /* ================= TOP CONSULTANT ================= */

  const consultantPerformance = useMemo(() => {
    const map: Record<string, number> = {};

    completedSessions.forEach((s) => {
      const name = s.consultant?.user?.email;
      if (!name) return;

      if (!map[name]) map[name] = 0;
      map[name] += s.price || 0;
    });

    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [completedSessions]);

  const topConsultant = consultantPerformance[0];

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <Layout title="Enterprise Analytics">
        <div className="flex justify-center items-center h-[60vh]">
          <Loader className="animate-spin text-blue-600" size={40} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Enterprise Analytics">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* ================= SUMMARY CARDS ================= */}
        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              label: "Total Sessions",
              value: totalSessions,
              icon: <BarChart3 size={22} />,
            },
            {
              label: "Completion Rate",
              value: `${completionRate}%`,
              icon: <CheckCircle size={22} />,
            },
            {
              label: "Total Revenue",
              value: `₹${totalRevenue.toLocaleString()}`,
              icon: <DollarSign size={22} />,
            },
            {
              label: "Active Consultants",
              value: activeConsultants,
              icon: <Users size={22} />,
            },
          ].map((card, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-3xl border shadow-sm"
            >
              <div className="text-blue-600 mb-4">{card.icon}</div>
              <p className="text-3xl font-bold text-gray-900">
                {card.value}
              </p>
              <p className="text-xs uppercase font-bold text-gray-400 mt-1">
                {card.label}
              </p>
            </div>
          ))}
        </div>

        {/* ================= MONTHLY REVENUE CHART ================= */}
        <div className="bg-white rounded-3xl p-8 border shadow-sm">
          <h3 className="text-lg font-bold mb-6">
            Monthly Revenue Trend
          </h3>

          <div className="h-64 flex items-end space-x-2">
            {monthlyRevenue.map((amount, i) => {
              const height = (amount / maxRevenue) * 100;
              return (
                <div key={i} className="flex-1 group relative">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                    ₹{amount}
                  </div>
                  <div
                    className="bg-blue-200 hover:bg-blue-600 transition-all rounded-t-lg"
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between mt-4 text-xs text-gray-400 uppercase font-bold">
            {[
              "Jan","Feb","Mar","Apr","May","Jun",
              "Jul","Aug","Sep","Oct","Nov","Dec",
            ].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>

        {/* ================= STATUS + TOP CONSULTANT ================= */}
        <div className="grid md:grid-cols-2 gap-6">

          <div className="bg-white rounded-3xl p-8 border shadow-sm">
            <h3 className="text-lg font-bold mb-6">
              Session Status Breakdown
            </h3>

            {Object.entries(statusCounts).map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between py-2 border-b text-sm"
              >
                <span>{key}</span>
                <span className="font-bold">{value}</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl p-8 border shadow-sm">
            <h3 className="text-lg font-bold mb-6">
              Top Performing Consultant
            </h3>

            {topConsultant ? (
              <div className="space-y-3">
                <p className="text-xl font-bold text-blue-600">
                  {topConsultant[0]}
                </p>
                <p className="text-gray-500">
                  Revenue Generated
                </p>
                <p className="text-2xl font-bold">
                  ₹{topConsultant[1].toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-gray-400">
                No completed sessions yet.
              </p>
            )}
          </div>

        </div>

      </div>
    </Layout>
  );
};

export default EnterpriseAnalytics;