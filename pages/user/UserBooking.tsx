import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { bookings as bookingsApi } from "../../services/api";
import { Booking } from "../../types";
import { Calendar, Video, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";

const UserBooking: React.FC = () => {
  const navigate = useNavigate();

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
      const data = await bookingsApi.getAll();
      setSessions(data || []);
    } catch (error) {
      console.error("Failed to fetch bookings", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTER LOGIC ================= */

  const filteredSessions = sessions.filter((session) => {
    if (activeTab === "UPCOMING") {
      return session.status === "CONFIRMED" || session.status === "LIVE";
    }
    if (activeTab === "COMPLETED") {
      return session.status === "COMPLETED";
    }
    return session.status === "CANCELLED";
  });

  return (
    <Layout title="My Bookings">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ================= TAB SWITCH ================= */}
        <div className="flex p-1 bg-gray-100 rounded-2xl w-fit">
          {["UPCOMING", "COMPLETED", "CANCELLED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                activeTab === tab
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ================= LOADING ================= */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader className="animate-spin text-blue-600" size={40} />
          </div>
        )}

        {/* ================= BOOKINGS LIST ================= */}
        {!loading && (
          <div className="space-y-6">

            {filteredSessions.length === 0 && (
              <div className="bg-white p-10 rounded-3xl border border-dashed text-center">
                <Calendar className="mx-auto text-gray-300 mb-4" size={60} />
                <h3 className="text-xl font-bold text-gray-900">
                  No bookings found
                </h3>
                <p className="text-gray-500 mt-2">
                  Try booking a consultant to get started.
                </p>
              </div>
            )}

            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition"
              >
                {/* LEFT SIDE */}
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <Video size={26} />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {session.consultant?.user?.email || "Consultant"}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {session.consultant?.domain || "Domain"}
                    </p>

                    <p className="text-sm text-gray-400 mt-1">
                      {new Date(session.date).toLocaleDateString()} •{" "}
                      {session.time_slot}
                    </p>
                  </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="flex items-center gap-4">

                  {session.status === "LIVE" && (
                    <button className="bg-red-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-red-700 transition">
                      Join Now
                    </button>
                  )}

                  {session.status !== "LIVE" && (
                    <button
                      onClick={() =>
                        navigate(`/user/consultant/${session.consultantId}`)
                      }
                      className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 transition"
                    >
                      View Details
                    </button>
                  )}

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      session.status === "LIVE"
                        ? "bg-red-100 text-red-600"
                        : session.status === "CONFIRMED"
                        ? "bg-blue-100 text-blue-600"
                        : session.status === "COMPLETED"
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {session.status}
                  </span>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserBooking;
