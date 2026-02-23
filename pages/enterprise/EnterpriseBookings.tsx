import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { bookings as bookingsApi } from "../../services/api";
import { Booking } from "../../types";
import {
  Calendar,
  Video,
  MessageSquare,
  Phone,
  MoreVertical,
  Filter,
  Users,
  Loader,
} from "lucide-react";

const EnterpriseBookings: React.FC = () => {
  const [sessions, setSessions] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "UPCOMING" | "COMPLETED" | "CANCELLED"
  >("UPCOMING");

  /* ================= FETCH BOOKINGS ================= */

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await bookingsApi.getAll(); // or enterprise-specific endpoint
      setSessions(data || []);
    } catch (error) {
      console.error("Failed to fetch enterprise bookings", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTER LOGIC ================= */

  const filteredSessions = sessions.filter((session) => {
    if (activeTab === "UPCOMING") {
      return (
        session.status === "CONFIRMED" ||
        session.status === "LIVE"
      );
    }
    if (activeTab === "COMPLETED") {
      return session.status === "COMPLETED";
    }
    return session.status === "CANCELLED";
  });

  return (
    <Layout title="Enterprise Bookings">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ================= TAB SWITCH ================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          <div className="flex p-1 bg-gray-100 rounded-2xl w-full sm:w-auto">
            {["UPCOMING", "COMPLETED", "CANCELLED"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${
                  activeTab === tab
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button className="flex items-center space-x-2 text-sm font-bold text-gray-500 bg-white border border-gray-100 px-4 py-2 rounded-xl hover:bg-gray-50">
            <Filter size={18} />
            <span>Filter</span>
          </button>

        </div>

        {/* ================= LOADING ================= */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader className="animate-spin text-blue-600" size={40} />
          </div>
        )}

        {/* ================= BOOKINGS LIST ================= */}
        {!loading && (
          <div className="space-y-4">

            {filteredSessions.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
                <Calendar
                  className="mx-auto text-gray-200 mb-4"
                  size={64}
                />
                <h4 className="text-xl font-bold text-gray-900">
                  No enterprise bookings found
                </h4>
                <p className="text-gray-500 mt-1">
                  New bookings will appear here once clients schedule sessions.
                </p>
              </div>
            )}

            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col lg:flex-row items-center gap-6 hover:border-blue-200 transition-all"
              >
                {/* SESSION TYPE ICON */}
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                  {session.type === "Video" ? (
                    <Video size={28} />
                  ) : session.type === "Audio" ? (
                    <Phone size={28} />
                  ) : (
                    <MessageSquare size={28} />
                  )}
                </div>

                {/* CLIENT INFO */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-gray-900">
                      Client: {session.user?.email || "User"}
                    </h3>

                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        session.status === "LIVE"
                          ? "bg-red-500 text-white animate-pulse"
                          : session.status === "CONFIRMED"
                          ? "bg-blue-100 text-blue-600"
                          : session.status === "COMPLETED"
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>

                  <p className="text-gray-500 font-medium">
                    Domain: {session.consultant?.domain || "—"}
                  </p>

                  {/* Assigned Consultant */}
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 justify-center lg:justify-start">
                    <Users size={14} />
                    <span>
                      Assigned Consultant:{" "}
                      {session.consultant?.user?.email || "Unassigned"}
                    </span>
                  </div>
                </div>

                {/* DATE & TIME */}
                <div className="px-6 border-x border-gray-50 hidden lg:block">
                  <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-1">
                    Date & Time
                  </p>
                  <p className="font-bold text-gray-900">
                    {new Date(session.date).toLocaleDateString()} •{" "}
                    {session.time_slot}
                  </p>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center space-x-3 w-full lg:w-auto">
                  <button className="flex-1 lg:flex-none bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    {session.status === "LIVE"
                      ? "Join Now"
                      : "View Details"}
                  </button>

                  <button className="p-3 text-gray-400 hover:bg-gray-50 rounded-xl transition-all">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>
            ))}

          </div>
        )}
      </div>
    </Layout>
  );
};

export default EnterpriseBookings;