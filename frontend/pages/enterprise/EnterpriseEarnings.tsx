import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";
import { bookings as bookingsApi } from "../../services/api";
import { Booking } from "../../types";
import {
  DollarSign,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Loader,
  PieChart,
} from "lucide-react";

const EnterpriseEarnings: React.FC = () => {
  const [sessions, setSessions] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("Month");

  /* ================= FETCH BOOKINGS ================= */

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await bookingsApi.getAll(); // Or enterprise-specific endpoint
      setSessions(data || []);
    } catch (error) {
      console.error("Failed to fetch earnings data", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTER COMPLETED ================= */

  const completedSessions = useMemo(() => {
    return sessions.filter((s) => s.status === "COMPLETED");
  }, [sessions]);

  /* ================= CALCULATIONS ================= */

  const totalRevenue = useMemo(() => {
    return completedSessions.reduce(
      (sum, s) => sum + (s.price || 0),
      0
    );
  }, [completedSessions]);

  const avgPerSession =
    completedSessions.length > 0
      ? totalRevenue / completedSessions.length
      : 0;

  const withdrawable = totalRevenue * 0.6;
  const pending = totalRevenue * 0.2;

  /* ================= MONTHLY DATA ================= */

  const monthlyData = useMemo(() => {
    const months = Array(12).fill(0);

    completedSessions.forEach((session) => {
      if (session.date) {
        const month = new Date(session.date).getMonth();
        months[month] += session.price || 0;
      }
    });

    return months;
  }, [completedSessions]);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <Layout title="Enterprise Earnings">
        <div className="flex justify-center items-center h-[60vh]">
          <Loader className="animate-spin text-blue-600" size={40} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Enterprise Earnings">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ================= SUMMARY CARDS ================= */}
        <div className="grid lg:grid-cols-4 gap-6">
          {[
            {
              label: "Total Revenue",
              value: `₹${totalRevenue.toLocaleString()}`,
              change: `${completedSessions.length} sessions`,
              up: true,
              icon: <DollarSign size={24} />,
              color: "bg-emerald-50 text-emerald-600",
            },
            {
              label: "Withdrawable",
              value: `₹${withdrawable.toLocaleString()}`,
              change: "Available",
              up: true,
              icon: <TrendingUp size={24} />,
              color: "bg-blue-50 text-blue-600",
            },
            {
              label: "Avg. per Session",
              value: `₹${avgPerSession.toFixed(0)}`,
              change: "Per session",
              up: true,
              icon: <PieChart size={24} />,
              color: "bg-purple-50 text-purple-600",
            },
            {
              label: "Pending Payout",
              value: `₹${pending.toLocaleString()}`,
              change: "Processing",
              up: false,
              icon: <Calendar size={24} />,
              color: "bg-amber-50 text-amber-600",
            },
          ].map((card, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm"
            >
              <div
                className={`${card.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6`}
              >
                {card.icon}
              </div>

              <p className="text-3xl font-black text-gray-900 mb-2">
                {card.value}
              </p>

              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  {card.label}
                </p>
                <div className="flex items-center text-[10px] font-black px-2 py-1 rounded-full bg-gray-100 text-gray-600 uppercase">
                  {card.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ================= CHART SECTION ================= */}
        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">

          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-900 uppercase">
              Earnings Trend
            </h3>

            <div className="flex p-1 bg-gray-50 rounded-xl">
              {["Week", "Month", "Year"].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveView(t)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase ${
                    activeView === t
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 flex items-end justify-between space-x-2">
            {monthlyData.map((amount, i) => {
              const maxValue = Math.max(...monthlyData, 1);
              const height = (amount / maxValue) * 100;

              return (
                <div key={i} className="flex-1 group relative">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{amount}
                  </div>
                  <div
                    className="bg-blue-100 rounded-t-lg group-hover:bg-blue-600 transition-all"
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between mt-6 px-2 text-[10px] font-black text-gray-400 uppercase">
            {[
              "Jan","Feb","Mar","Apr","May","Jun",
              "Jul","Aug","Sep","Oct","Nov","Dec",
            ].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default EnterpriseEarnings;